#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart Tennis Arena - deteccao de acertos e erros em parede com LEDs.

Fluxo:
  1. Calibracao: clique em 4 pontos (cantos da parede da maquete, sentido horario
     comecando pelo canto superior esquerdo). Os pontos viram uma homografia que
     converte pixels da imagem em centimetros no plano da parede.
  2. Alvo: o LED aceso define o alvo. Tres modos:
       serial  -> o Arduino informa qual LED esta aceso
       vision  -> o LED aceso e detectado pelo brilho dentro da parede
       manual  -> teclas 1..9 definem o LED ativo (teste sem hardware)
  3. Impacto: o tracker da bola (YOLO) detecta a batida na parede por inversao de
     trajetoria, inversao de escala aparente ou perda subita do rastreio dentro da
     regiao calibrada.
  4. Pontuacao: cada impacto dentro da parede consome uma das N batidas (default 10).
     Distancia do impacto ate o centro do LED <= tolerancia => acerto; senao => erro.

Protocolo serial sugerido (Arduino -> PC), uma linha por mensagem:
    LED:3        -> LED de indice 3 aceso (indices 0..rows*cols-1, row-major)
    LED:-1       -> nenhum LED aceso
    OFF          -> nenhum LED aceso

Protocolo serial (PC -> Arduino):
    RESULT:HIT;3;1    -> acerto no LED 3, batida 1
    RESULT:MISS;3;2   -> erro (LED 3 estava aceso), batida 2
    END;7;3           -> fim de partida com 7 acertos e 3 erros
    RESET             -> partida reiniciada

Teclas:
    q  sair                      c  recalibrar a parede
    r  reiniciar a partida       v  mostrar/ocultar a vista retificada
    p  salvar screenshot         espaco  registrar impacto manual na posicao da bola
    1..9  define LED ativo (modo manual)      0  nenhum LED      n  proximo LED

Exemplos:
    python tennis_arena.py --model best.pt --source usb0 --resolution 1280x720
    python tennis_arena.py --model best.pt --source usb0 --port /dev/ttyUSB0 --led-mode serial
    python tennis_arena.py --model best.pt --source partida.mp4 --led-mode manual --show-plane
"""

import argparse
import csv
import json
import math
import os
import sys
import threading
import time
import unicodedata
from collections import deque
from datetime import datetime

import cv2
import numpy as np
from ultralytics import YOLO

try:
    import serial  # pyserial
except ImportError:
    serial = None


FONT = cv2.FONT_HERSHEY_SIMPLEX
WINDOW = 'Smart Tennis Arena'
PLANE_WINDOW = 'Parede retificada'

COLOR_WALL = (0, 220, 255)
COLOR_GRID = (90, 90, 90)
COLOR_TARGET = (0, 255, 0)
COLOR_HIT = (0, 255, 0)
COLOR_MISS = (0, 0, 255)
COLOR_BALL = (255, 160, 0)
COLOR_TEXT = (255, 255, 255)


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def ascii_safe(text):
    """cv2.putText nao renderiza acentos; remove diacriticos antes de desenhar."""
    return unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('ascii')


def draw_text(img, text, org, scale=0.6, color=COLOR_TEXT, thick=1):
    cv2.putText(img, ascii_safe(text), org, FONT, scale, color, thick, cv2.LINE_AA)


def draw_panel(img, lines, origin=(10, 10), width=340):
    """Painel semitransparente. lines = lista de (texto, cor)."""
    h = 24 * len(lines) + 14
    x, y = origin
    overlay = img.copy()
    cv2.rectangle(overlay, (x, y), (x + width, y + h), (25, 25, 25), cv2.FILLED)
    cv2.addWeighted(overlay, 0.55, img, 0.45, 0, img)
    cv2.rectangle(img, (x, y), (x + width, y + h), (70, 70, 70), 1)
    cursor = y + 28
    for text, color in lines:
        draw_text(img, text, (x + 12, cursor), 0.6, color, 1)
        cursor += 24


def order_points(pts):
    """Ordena 4 pontos como [sup-esq, sup-dir, inf-dir, inf-esq]."""
    pts = np.asarray(pts, dtype=np.float32).reshape(4, 2)
    s = pts.sum(axis=1)
    d = (pts[:, 0] - pts[:, 1])
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmax(d)]
    bl = pts[np.argmin(d)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def parse_pair(text, sep='x', cast=float):
    a, b = text.lower().split(sep)
    return cast(a), cast(b)


# ---------------------------------------------------------------------------
# Calibracao da parede (homografia imagem <-> plano em cm)
# ---------------------------------------------------------------------------

class WallCalibration:
    def __init__(self, wall_w_cm, wall_h_cm, px_per_cm):
        self.wall_w = float(wall_w_cm)
        self.wall_h = float(wall_h_cm)
        self.px_per_cm = float(px_per_cm)
        self.plane_w_px = int(round(self.wall_w * self.px_per_cm))
        self.plane_h_px = int(round(self.wall_h * self.px_per_cm))
        self.points = []
        self.quad = None
        self.H = None       # imagem -> plano (pixels do plano)
        self.H_inv = None   # plano -> imagem

    # -- coleta de pontos -------------------------------------------------
    @property
    def ready(self):
        return self.H is not None

    @property
    def complete(self):
        return len(self.points) == 4

    def add_point(self, x, y):
        if len(self.points) < 4:
            self.points.append([float(x), float(y)])

    def clear_points(self):
        self.points = []

    def finalize(self):
        self.quad = order_points(self.points)
        dst = np.array([[0, 0],
                        [self.plane_w_px, 0],
                        [self.plane_w_px, self.plane_h_px],
                        [0, self.plane_h_px]], dtype=np.float32)
        self.H = cv2.getPerspectiveTransform(self.quad, dst)
        self.H_inv = np.linalg.inv(self.H)

    # -- conversoes -------------------------------------------------------
    def image_to_cm(self, pt):
        p = np.array([[[float(pt[0]), float(pt[1])]]], dtype=np.float32)
        out = cv2.perspectiveTransform(p, self.H)[0][0]
        return float(out[0] / self.px_per_cm), float(out[1] / self.px_per_cm)

    def cm_to_image(self, pt_cm):
        p = np.array([[[pt_cm[0] * self.px_per_cm, pt_cm[1] * self.px_per_cm]]], dtype=np.float32)
        out = cv2.perspectiveTransform(p, self.H_inv)[0][0]
        return int(round(out[0])), int(round(out[1]))

    def cm_to_plane_px(self, pt_cm):
        return int(round(pt_cm[0] * self.px_per_cm)), int(round(pt_cm[1] * self.px_per_cm))

    def inside_cm(self, pt_cm, margin_cm=0.0):
        x, y = pt_cm
        return (-margin_cm <= x <= self.wall_w + margin_cm and
                -margin_cm <= y <= self.wall_h + margin_cm)

    def warp(self, frame):
        return cv2.warpPerspective(frame, self.H, (self.plane_w_px, self.plane_h_px))

    # -- persistencia -----------------------------------------------------
    def save(self, path):
        data = {
            'points': np.asarray(self.quad).tolist(),
            'wall_cm': [self.wall_w, self.wall_h],
            'px_per_cm': self.px_per_cm,
            'saved_at': datetime.now().isoformat(timespec='seconds'),
        }
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

    def load(self, path):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.points = [list(map(float, p)) for p in data['points']]
        if 'wall_cm' in data:
            self.wall_w, self.wall_h = map(float, data['wall_cm'])
        if 'px_per_cm' in data:
            self.px_per_cm = float(data['px_per_cm'])
        self.plane_w_px = int(round(self.wall_w * self.px_per_cm))
        self.plane_h_px = int(round(self.wall_h * self.px_per_cm))
        self.finalize()


# ---------------------------------------------------------------------------
# Grade de LEDs
# ---------------------------------------------------------------------------

class TargetGrid:
    """Mapeia indice de LED -> posicao em cm no plano da parede (row-major)."""

    def __init__(self, rows, cols, wall_w, wall_h):
        self.rows = int(rows)
        self.cols = int(cols)
        self.wall_w = float(wall_w)
        self.wall_h = float(wall_h)
        self.cell_w = self.wall_w / self.cols
        self.cell_h = self.wall_h / self.rows

    @property
    def count(self):
        return self.rows * self.cols

    def center_cm(self, idx):
        if idx is None or not (0 <= idx < self.count):
            return None
        r, c = divmod(int(idx), self.cols)
        return ((c + 0.5) * self.cell_w, (r + 0.5) * self.cell_h)

    def index_from_cm(self, pt_cm):
        c = int(min(max(pt_cm[0] // self.cell_w, 0), self.cols - 1))
        r = int(min(max(pt_cm[1] // self.cell_h, 0), self.rows - 1))
        return r * self.cols + c

    def cell_corners_cm(self, idx):
        r, c = divmod(int(idx), self.cols)
        x0, y0 = c * self.cell_w, r * self.cell_h
        x1, y1 = x0 + self.cell_w, y0 + self.cell_h
        return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


# ---------------------------------------------------------------------------
# Comunicacao com o Arduino
# ---------------------------------------------------------------------------

class ArduinoLink:
    def __init__(self, port, baud=115200, timeout=0.1):
        if serial is None:
            raise RuntimeError('pyserial nao instalado. Rode: pip install pyserial')
        self.ser = serial.Serial(port, baud, timeout=timeout)
        self.port = port
        self.connected = True
        self._led = None
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._reader, daemon=True)
        self._thread.start()
        time.sleep(2.0)  # tempo de reset da placa

    def _reader(self):
        while not self._stop.is_set():
            try:
                raw = self.ser.readline()
            except Exception:
                self.connected = False
                return
            if not raw:
                continue
            line = raw.decode('utf-8', errors='ignore').strip().upper().replace(' ', '')
            if not line:
                continue
            self._parse(line)

    def _parse(self, line):
        value = None
        if line.startswith('LED'):
            payload = line[3:].lstrip(':,=')
            try:
                value = int(payload)
            except ValueError:
                return
        elif line in ('OFF', 'NONE', 'CLEAR'):
            value = -1
        else:
            try:
                value = int(line)
            except ValueError:
                return
        with self._lock:
            self._led = None if value < 0 else value

    def get_led(self):
        with self._lock:
            return self._led

    def send(self, message):
        if not self.connected:
            return
        try:
            self.ser.write((message + '\n').encode('utf-8'))
        except Exception:
            self.connected = False

    def close(self):
        self._stop.set()
        try:
            self.ser.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Deteccao do LED aceso por visao (fallback sem serial)
# ---------------------------------------------------------------------------

def detect_led_vision(plane_img, min_value=225, min_area=12):
    """Retorna (x_cm, y_cm) em pixels do plano do blob mais brilhante, ou None."""
    hsv = cv2.cvtColor(plane_img, cv2.COLOR_BGR2HSV)
    value = cv2.GaussianBlur(hsv[:, :, 2], (9, 9), 0)
    _, mask = cv2.threshold(value, min_value, 255, cv2.THRESH_BINARY)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best, best_area = None, 0.0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area or area <= best_area:
            continue
        m = cv2.moments(cnt)
        if m['m00'] == 0:
            continue
        best = (m['m10'] / m['m00'], m['m01'] / m['m00'])
        best_area = area
    return best


# ---------------------------------------------------------------------------
# Rastreio da bola e deteccao de impacto
# ---------------------------------------------------------------------------

class BallTracker:
    """
    Detecta o instante da batida na parede. Sem informacao de profundidade,
    o impacto e inferido por tres sinais dentro da regiao calibrada:
      1. inversao da direcao do movimento (rebote);
      2. inversao da escala aparente da bbox (minimo ou maximo local);
      3. perda subita do rastreio (borrao no frame do impacto).
    """

    def __init__(self, mode='auto', cooldown=0.5, lost_frames=3, min_speed=2.0):
        self.mode = mode
        self.cooldown = float(cooldown)
        self.lost_frames = int(lost_frames)
        self.min_speed = float(min_speed)
        self.hist = deque(maxlen=16)
        self.last_impact_t = -1e9
        self.missing = 0
        self.was_inside = False

    def reset(self):
        self.hist.clear()
        self.missing = 0
        self.was_inside = False
        self.last_impact_t = -1e9

    def _cooling(self, t):
        return (t - self.last_impact_t) < self.cooldown

    def force_impact(self, t):
        """Impacto manual (tecla espaco) na ultima posicao conhecida."""
        if not self.hist:
            return None
        last = self.hist[-1]
        self.last_impact_t = t
        return (last['cx'], last['cy'], 'manual')

    def update(self, det, t, inside_fn):
        impact = None

        if det is None:
            self.missing += 1
            if (self.hist and self.missing == self.lost_frames
                    and self.hist[-1]['inside'] and not self._cooling(t)):
                impact = (self.hist[-1]['cx'], self.hist[-1]['cy'], 'perda de rastreio')
            if self.missing > self.lost_frames * 4:
                self.hist.clear()
                self.was_inside = False
        else:
            self.missing = 0
            inside = inside_fn((det['cx'], det['cy']))
            self.hist.append({
                't': t,
                'cx': det['cx'],
                'cy': det['cy'],
                'scale': math.sqrt(max(det['area'], 1.0)),
                'inside': inside,
            })
            if not self._cooling(t):
                if self.mode == 'enter':
                    if inside and not self.was_inside:
                        impact = (det['cx'], det['cy'], 'entrada na parede')
                else:
                    impact = self._detect_reversal()
            self.was_inside = inside

        if impact is not None:
            self.last_impact_t = t
        return impact

    def _detect_reversal(self):
        if len(self.hist) < 3:
            return None
        p0, p1, p2 = self.hist[-3], self.hist[-2], self.hist[-1]
        if not p1['inside']:
            return None

        v1 = np.array([p1['cx'] - p0['cx'], p1['cy'] - p0['cy']], dtype=float)
        v2 = np.array([p2['cx'] - p1['cx'], p2['cy'] - p1['cy']], dtype=float)
        n1, n2 = float(np.linalg.norm(v1)), float(np.linalg.norm(v2))
        if n1 >= self.min_speed and n2 >= self.min_speed:
            cos = float(np.dot(v1, v2)) / (n1 * n2)
            if cos < -0.25:  # angulo > ~105 graus entre os vetores
                return (p1['cx'], p1['cy'], 'inversao de trajetoria')

        s0, s1, s2 = p0['scale'], p1['scale'], p2['scale']
        if s1 > 0:
            if s1 < s0 * 0.97 and s2 > s1 * 1.06:   # camera atras do jogador
                return (p1['cx'], p1['cy'], 'inversao de escala')
            if s1 > s0 * 1.03 and s2 < s1 * 0.94:   # camera atras da parede
                return (p1['cx'], p1['cy'], 'inversao de escala')
        return None


# ---------------------------------------------------------------------------
# Estado da partida
# ---------------------------------------------------------------------------

class ArenaGame:
    def __init__(self, total_shots, tolerance_cm, log_path=None):
        self.total = int(total_shots)
        self.tolerance = float(tolerance_cm)
        self.log_path = log_path
        self.reset()

    def reset(self):
        self.records = []
        self.hits = 0
        self.errors = 0
        self.started_at = time.time()
        self.saved = False

    @property
    def shots(self):
        return len(self.records)

    @property
    def remaining(self):
        return max(self.total - self.shots, 0)

    @property
    def finished(self):
        return self.shots >= self.total

    @property
    def accuracy(self):
        return (100.0 * self.hits / self.shots) if self.shots else 0.0

    def register(self, impact_cm, target_cm, target_idx, reason):
        dist = None
        if target_cm is not None:
            dist = float(math.hypot(impact_cm[0] - target_cm[0], impact_cm[1] - target_cm[1]))
        hit = dist is not None and dist <= self.tolerance

        record = {
            'batida': self.shots + 1,
            'resultado': 'ACERTO' if hit else 'ERRO',
            'led': target_idx if target_idx is not None else -1,
            'impacto_x_cm': round(impact_cm[0], 1),
            'impacto_y_cm': round(impact_cm[1], 1),
            'distancia_cm': round(dist, 1) if dist is not None else '',
            'motivo_deteccao': reason,
            'tempo_s': round(time.time() - self.started_at, 2),
        }
        self.records.append(record)
        if hit:
            self.hits += 1
        else:
            self.errors += 1
        return record

    def save_log(self):
        if self.saved or not self.log_path or not self.records:
            return None
        fields = list(self.records[0].keys())
        exists = os.path.exists(self.log_path)
        with open(self.log_path, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            if not exists:
                writer.writeheader()
            writer.writerows(self.records)
        self.saved = True
        return self.log_path


# ---------------------------------------------------------------------------
# Deteccao YOLO
# ---------------------------------------------------------------------------

def pick_ball(result, class_id, thresh):
    """Retorna a deteccao de maior confianca da classe alvo, ou None."""
    boxes = result.boxes
    best = None
    for i in range(len(boxes)):
        conf = float(boxes[i].conf.item())
        if conf < thresh:
            continue
        cls = int(boxes[i].cls.item())
        if class_id is not None and cls != class_id:
            continue
        if best is not None and conf <= best['conf']:
            continue
        xyxy = boxes[i].xyxy.cpu().numpy().squeeze().astype(int)
        xmin, ymin, xmax, ymax = [int(v) for v in xyxy]
        best = {
            'conf': conf,
            'cls': cls,
            'bbox': (xmin, ymin, xmax, ymax),
            'cx': (xmin + xmax) / 2.0,
            'cy': (ymin + ymax) / 2.0,
            'area': float(max(xmax - xmin, 1) * max(ymax - ymin, 1)),
        }
    return best


def resolve_class_id(value, labels):
    if value is None:
        return None
    try:
        return int(value)
    except ValueError:
        pass
    for idx, name in labels.items():
        if str(name).lower() == str(value).lower():
            return int(idx)
    print(f'AVISO: classe "{value}" nao existe no modelo. Classes: {labels}')
    return None


# ---------------------------------------------------------------------------
# Desenho da cena
# ---------------------------------------------------------------------------

def draw_wall(frame, calib, grid, target_idx, tolerance_cm):
    if not calib.ready:
        return
    quad = calib.quad.astype(np.int32).reshape(-1, 1, 2)
    cv2.polylines(frame, [quad], True, COLOR_WALL, 2, cv2.LINE_AA)

    for idx in range(grid.count):
        corners = [calib.cm_to_image(p) for p in grid.cell_corners_cm(idx)]
        pts = np.array(corners, dtype=np.int32).reshape(-1, 1, 2)
        cv2.polylines(frame, [pts], True, COLOR_GRID, 1, cv2.LINE_AA)
        cx, cy = calib.cm_to_image(grid.center_cm(idx))
        draw_text(frame, str(idx), (cx - 6, cy + 5), 0.45, COLOR_GRID, 1)

    if target_idx is not None:
        center_cm = grid.center_cm(target_idx)
        if center_cm is not None:
            cx, cy = calib.cm_to_image(center_cm)
            edge = calib.cm_to_image((center_cm[0] + tolerance_cm, center_cm[1]))
            radius = int(max(math.hypot(edge[0] - cx, edge[1] - cy), 6))
            cv2.circle(frame, (cx, cy), radius, COLOR_TARGET, 2, cv2.LINE_AA)
            cv2.circle(frame, (cx, cy), 4, COLOR_TARGET, cv2.FILLED)
            draw_text(frame, f'ALVO {target_idx}', (cx - 30, cy - radius - 8), 0.55, COLOR_TARGET, 2)


def draw_ball(frame, det, label):
    xmin, ymin, xmax, ymax = det['bbox']
    cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), COLOR_BALL, 2)
    cv2.circle(frame, (int(det['cx']), int(det['cy'])), 3, COLOR_BALL, cv2.FILLED)
    draw_text(frame, f"{label} {int(det['conf'] * 100)}%", (xmin, max(ymin - 8, 14)), 0.5, COLOR_BALL, 1)


def draw_trail(frame, tracker):
    pts = [(int(p['cx']), int(p['cy'])) for p in tracker.hist]
    for i in range(1, len(pts)):
        cv2.line(frame, pts[i - 1], pts[i], (200, 200, 60), 1, cv2.LINE_AA)


def draw_impacts(frame, calib, impacts, now, ttl=4.0):
    for imp in impacts:
        age = now - imp['t']
        if age > ttl:
            continue
        color = COLOR_HIT if imp['hit'] else COLOR_MISS
        x, y = calib.cm_to_image(imp['cm'])
        cv2.drawMarker(frame, (x, y), color, cv2.MARKER_CROSS, 22, 2)
        cv2.circle(frame, (x, y), 10, color, 2, cv2.LINE_AA)
        draw_text(frame, f"#{imp['shot']}", (x + 12, y - 10), 0.5, color, 1)


def build_plane_view(frame, calib, grid, target_idx, tolerance_cm, impacts):
    plane = calib.warp(frame)
    for idx in range(grid.count):
        corners = [calib.cm_to_plane_px(p) for p in grid.cell_corners_cm(idx)]
        pts = np.array(corners, dtype=np.int32).reshape(-1, 1, 2)
        cv2.polylines(plane, [pts], True, COLOR_GRID, 1)
    if target_idx is not None and grid.center_cm(target_idx) is not None:
        c = calib.cm_to_plane_px(grid.center_cm(target_idx))
        cv2.circle(plane, c, int(tolerance_cm * calib.px_per_cm), COLOR_TARGET, 2)
        cv2.circle(plane, c, 4, COLOR_TARGET, cv2.FILLED)
    for imp in impacts:
        color = COLOR_HIT if imp['hit'] else COLOR_MISS
        p = calib.cm_to_plane_px(imp['cm'])
        cv2.drawMarker(plane, p, color, cv2.MARKER_CROSS, 18, 2)
        draw_text(plane, f"#{imp['shot']}", (p[0] + 10, p[1] - 8), 0.45, color, 1)
    return plane


# ---------------------------------------------------------------------------
# Argumentos
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description='Smart Tennis Arena - acertos e erros na parede de LEDs')
    p.add_argument('--model', required=True, help='Caminho do modelo YOLO (ex: runs/detect/train/weights/best.pt)')
    p.add_argument('--source', required=True, help='Fonte: video ("jogo.mp4"), camera USB ("usb0") ou "picamera0"')
    p.add_argument('--thresh', type=float, default=0.5, help='Confianca minima da deteccao da bola')
    p.add_argument('--resolution', default=None, help='Resolucao de processamento/exibicao, ex: 1280x720')
    p.add_argument('--record', action='store_true', help='Grava a saida em demo_arena.avi (exige --resolution)')
    p.add_argument('--ball-class', default=None, help='Nome ou indice da classe da bola (default: qualquer classe)')

    p.add_argument('--calib', default='arena_calib.json', help='Arquivo JSON de calibracao da parede')
    p.add_argument('--recalibrate', action='store_true', help='Ignora a calibracao salva e pede 4 pontos novos')
    p.add_argument('--wall', default='120x80', help='Dimensoes reais da parede em cm, ex: 120x80')
    p.add_argument('--grid', default='3x3', help='Grade de LEDs linhas x colunas, ex: 3x3')
    p.add_argument('--px-per-cm', type=float, default=5.0, help='Escala da vista retificada')

    p.add_argument('--shots', type=int, default=10, help='Numero de batidas por partida')
    p.add_argument('--tolerance', type=float, default=10.0, help='Raio de acerto em cm ao redor do LED')
    p.add_argument('--margin', type=float, default=5.0, help='Folga em cm para considerar o impacto dentro da parede')
    p.add_argument('--impact-mode', choices=['auto', 'enter'], default='auto', help='Criterio de deteccao do impacto')
    p.add_argument('--cooldown', type=float, default=0.5, help='Intervalo minimo em s entre dois impactos')
    p.add_argument('--lost-frames', type=int, default=3, help='Frames sem bola para assumir impacto por perda de rastreio')

    p.add_argument('--led-mode', choices=['auto', 'serial', 'vision', 'manual'], default='auto',
                   help='Origem do alvo: serial (Arduino), vision (brilho) ou manual (teclado)')
    p.add_argument('--port', default=None, help='Porta serial do Arduino, ex: /dev/ttyUSB0 ou COM3')
    p.add_argument('--baud', type=int, default=115200, help='Baud rate da serial')
    p.add_argument('--led-min-value', type=int, default=225, help='Brilho minimo (0-255) do LED no modo vision')

    p.add_argument('--log', default='resultados_arena.csv', help='CSV com o resultado das batidas ("" desativa)')
    p.add_argument('--show-plane', action='store_true', help='Abre a janela com a parede retificada')
    return p.parse_args()


# ---------------------------------------------------------------------------
# Programa principal
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    if not os.path.exists(args.model):
        print('ERRO: modelo nao encontrado em', args.model)
        sys.exit(1)

    model = YOLO(args.model, task='detect')
    labels = model.names
    ball_class_id = resolve_class_id(args.ball_class, labels)
    ball_label = labels.get(ball_class_id, 'bola') if ball_class_id is not None else 'bola'

    # --- fonte de video ---------------------------------------------------
    source = args.source
    if os.path.isfile(source):
        source_type = 'video'
    elif source.startswith('usb'):
        source_type = 'usb'
    elif source.startswith('picamera'):
        source_type = 'picamera'
    else:
        print('ERRO: fonte invalida. Use um arquivo de video, "usb0" ou "picamera0".')
        sys.exit(1)

    resize = args.resolution is not None
    resW = resH = None
    if resize:
        resW, resH = parse_pair(args.resolution, 'x', int)

    cap = None
    if source_type in ('video', 'usb'):
        cap_arg = source if source_type == 'video' else int(source[3:])
        cap = cv2.VideoCapture(cap_arg)
        if resize:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, resW)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resH)
        if not cap.isOpened():
            print('ERRO: nao foi possivel abrir a fonte de video.')
            sys.exit(1)
    else:
        from picamera2 import Picamera2
        if not resize:
            resW, resH = 1280, 720
            resize = True
        cap = Picamera2()
        cap.configure(cap.create_video_configuration(main={'format': 'XRGB8888', 'size': (resW, resH)}))
        cap.start()

    recorder = None
    if args.record:
        if not resize:
            print('ERRO: --record exige --resolution.')
            sys.exit(1)
        recorder = cv2.VideoWriter('demo_arena.avi', cv2.VideoWriter_fourcc(*'MJPG'), 30, (resW, resH))

    # --- componentes da arena --------------------------------------------
    wall_w, wall_h = parse_pair(args.wall, 'x', float)
    rows, cols = parse_pair(args.grid, 'x', int)
    calib = WallCalibration(wall_w, wall_h, args.px_per_cm)
    grid = TargetGrid(rows, cols, wall_w, wall_h)

    if os.path.exists(args.calib) and not args.recalibrate:
        try:
            calib.load(args.calib)
            grid = TargetGrid(rows, cols, calib.wall_w, calib.wall_h)
            print('Calibracao carregada de', args.calib)
        except Exception as exc:
            print('AVISO: falha ao carregar calibracao:', exc)

    led_mode = args.led_mode
    if led_mode == 'auto':
        led_mode = 'serial' if args.port else 'manual'

    link = None
    if led_mode == 'serial':
        try:
            link = ArduinoLink(args.port, args.baud)
            print('Serial conectada em', args.port)
        except Exception as exc:
            print('AVISO: falha na serial (', exc, ') -> modo manual.')
            led_mode = 'manual'

    game = ArenaGame(args.shots, args.tolerance, args.log or None)
    tracker = BallTracker(args.impact_mode, args.cooldown, args.lost_frames)

    ui = {'calibrating': not calib.ready, 'manual_led': None, 'show_plane': args.show_plane}
    impacts = []

    def on_mouse(event, x, y, flags, param):
        if not ui['calibrating']:
            return
        if event == cv2.EVENT_LBUTTONDOWN:
            calib.add_point(x, y)
            if calib.complete:
                calib.finalize()
                try:
                    calib.save(args.calib)
                except Exception as exc:
                    print('AVISO: nao foi possivel salvar a calibracao:', exc)
                ui['calibrating'] = False
                tracker.reset()
        elif event == cv2.EVENT_RBUTTONDOWN:
            calib.clear_points()

    cv2.namedWindow(WINDOW)
    cv2.setMouseCallback(WINDOW, on_mouse)

    fps_buffer = deque(maxlen=120)
    avg_fps = 0.0

    print('Pressione "c" para calibrar, "r" para reiniciar, "q" para sair.')

    while True:
        t_start = time.perf_counter()

        # --- captura ------------------------------------------------------
        if source_type == 'picamera':
            frame_bgra = cap.capture_array()
            frame = cv2.cvtColor(np.copy(frame_bgra), cv2.COLOR_BGRA2BGR)
            ret = frame is not None
        else:
            ret, frame = cap.read()
        if not ret or frame is None:
            print('Fim do video ou camera indisponivel.')
            break
        if resize:
            frame = cv2.resize(frame, (resW, resH))

        now = time.time()
        det = None
        target_idx = None
        target_cm = None

        if ui['calibrating']:
            # --- modo calibracao -----------------------------------------
            for i, pt in enumerate(calib.points):
                cv2.circle(frame, (int(pt[0]), int(pt[1])), 6, COLOR_WALL, cv2.FILLED)
                draw_text(frame, str(i + 1), (int(pt[0]) + 10, int(pt[1]) - 10), 0.6, COLOR_WALL, 2)
            if len(calib.points) > 1:
                pts = np.array(calib.points, dtype=np.int32).reshape(-1, 1, 2)
                cv2.polylines(frame, [pts], False, COLOR_WALL, 2)
            draw_panel(frame, [
                ('CALIBRACAO DA PAREDE', COLOR_WALL),
                (f'Clique nos 4 cantos ({len(calib.points)}/4)', COLOR_TEXT),
                ('Ordem: sup-esq, sup-dir, inf-dir, inf-esq', COLOR_TEXT),
                ('Botao direito: refazer os pontos', COLOR_TEXT),
                (f'Parede: {calib.wall_w:.0f} x {calib.wall_h:.0f} cm', COLOR_TEXT),
            ], width=400)
        else:
            # --- inferencia ----------------------------------------------
            results = model(frame, verbose=False)
            det = pick_ball(results[0], ball_class_id, args.thresh)

            def inside_fn(pt):
                return calib.inside_cm(calib.image_to_cm(pt), args.margin)

            impact = tracker.update(det, now, inside_fn)

            # --- alvo ativo ----------------------------------------------
            if led_mode == 'serial' and link is not None:
                target_idx = link.get_led()
                target_cm = grid.center_cm(target_idx)
            elif led_mode == 'vision':
                plane = calib.warp(frame)
                blob = detect_led_vision(plane, args.led_min_value)
                if blob is not None:
                    target_cm = (blob[0] / calib.px_per_cm, blob[1] / calib.px_per_cm)
                    target_idx = grid.index_from_cm(target_cm)
            else:
                target_idx = ui['manual_led']
                target_cm = grid.center_cm(target_idx)

            # --- registro da batida --------------------------------------
            if impact is not None and not game.finished:
                impact_cm = calib.image_to_cm((impact[0], impact[1]))
                if calib.inside_cm(impact_cm, args.margin):
                    record = game.register(impact_cm, target_cm, target_idx, impact[2])
                    hit = record['resultado'] == 'ACERTO'
                    impacts.append({'cm': impact_cm, 'hit': hit, 'shot': record['batida'], 't': now})
                    print(f"Batida {record['batida']:02d}/{game.total}: {record['resultado']} "
                          f"(LED {record['led']}, dist {record['distancia_cm']} cm, {record['motivo_deteccao']})")
                    if link is not None:
                        link.send(f"RESULT:{'HIT' if hit else 'MISS'};"
                                  f"{record['led']};{record['batida']}")
                    if game.finished:
                        path = game.save_log()
                        if link is not None:
                            link.send(f'END;{game.hits};{game.errors}')
                        print(f'Partida encerrada: {game.hits} acertos / {game.errors} erros '
                              f'({game.accuracy:.1f}%)' + (f' - log em {path}' if path else ''))

            # --- desenho --------------------------------------------------
            draw_wall(frame, calib, grid, target_idx, args.tolerance)
            draw_trail(frame, tracker)
            if det is not None:
                draw_ball(frame, det, ball_label)
            draw_impacts(frame, calib, impacts, now)

            serial_status = 'serial OK' if (link and link.connected) else led_mode
            panel = [
                (f'BATIDAS {game.shots}/{game.total}   RESTAM {game.remaining}', COLOR_WALL),
                (f'ACERTOS: {game.hits}', COLOR_HIT),
                (f'ERROS:   {game.errors}', COLOR_MISS),
                (f'Precisao: {game.accuracy:.1f}%', COLOR_TEXT),
                (f'Alvo: LED {target_idx if target_idx is not None else "-"}   ({serial_status})', COLOR_TEXT),
                (f'FPS: {avg_fps:.1f}   Bola: {"sim" if det else "nao"}', COLOR_TEXT),
            ]
            draw_panel(frame, panel)

            if game.finished:
                h, w = frame.shape[:2]
                overlay = frame.copy()
                cv2.rectangle(overlay, (w // 2 - 250, h // 2 - 90), (w // 2 + 250, h // 2 + 90),
                              (20, 20, 20), cv2.FILLED)
                cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
                draw_text(frame, 'FIM DA PARTIDA', (w // 2 - 150, h // 2 - 40), 1.1, COLOR_WALL, 2)
                draw_text(frame, f'Acertos: {game.hits}   Erros: {game.errors}',
                          (w // 2 - 150, h // 2 + 5), 0.8, COLOR_TEXT, 2)
                draw_text(frame, f'Precisao: {game.accuracy:.1f}%  |  "r" para reiniciar',
                          (w // 2 - 150, h // 2 + 50), 0.6, COLOR_TEXT, 1)

            if ui['show_plane'] and calib.ready:
                cv2.imshow(PLANE_WINDOW,
                           build_plane_view(frame, calib, grid, target_idx, args.tolerance, impacts))

        cv2.imshow(WINDOW, frame)
        if recorder is not None:
            recorder.write(frame)

        # --- teclado ------------------------------------------------------
        key = cv2.waitKey(1) & 0xFF
        if key in (ord('q'), ord('Q'), 27):
            break
        elif key in (ord('c'), ord('C')):
            calib.clear_points()
            ui['calibrating'] = True
        elif key in (ord('r'), ord('R')):
            game.reset()
            tracker.reset()
            impacts.clear()
            if link is not None:
                link.send('RESET')
            print('Partida reiniciada.')
        elif key in (ord('p'), ord('P')):
            name = f'capture_{datetime.now().strftime("%H%M%S")}.png'
            cv2.imwrite(name, frame)
            print('Screenshot salvo em', name)
        elif key in (ord('v'), ord('V')):
            ui['show_plane'] = not ui['show_plane']
            if not ui['show_plane']:
                cv2.destroyWindow(PLANE_WINDOW)
        elif key == ord(' ') and not ui['calibrating']:
            forced = tracker.force_impact(now)
            if forced is not None and not game.finished:
                impact_cm = calib.image_to_cm((forced[0], forced[1]))
                if calib.inside_cm(impact_cm, args.margin):
                    record = game.register(impact_cm, target_cm, target_idx, 'manual')
                    impacts.append({'cm': impact_cm, 'hit': record['resultado'] == 'ACERTO',
                                    'shot': record['batida'], 't': now})
                    print(f"Batida manual {record['batida']}: {record['resultado']}")
        elif ord('0') <= key <= ord('9') and led_mode == 'manual':
            digit = key - ord('0')
            ui['manual_led'] = None if digit == 0 else min(digit - 1, grid.count - 1)
        elif key in (ord('n'), ord('N')) and led_mode == 'manual':
            current = ui['manual_led']
            ui['manual_led'] = 0 if current is None else (current + 1) % grid.count

        # --- FPS ----------------------------------------------------------
        fps_buffer.append(1.0 / max(time.perf_counter() - t_start, 1e-6))
        avg_fps = float(np.mean(fps_buffer))

    # --- encerramento ------------------------------------------------------
    path = game.save_log()
    print(f'\nResumo: {game.shots} batidas | {game.hits} acertos | {game.errors} erros '
          f'| precisao {game.accuracy:.1f}%')
    if path:
        print('Log salvo em', path)
    print(f'FPS medio: {avg_fps:.2f}')

    if link is not None:
        link.close()
    if source_type == 'picamera':
        cap.stop()
    elif cap is not None:
        cap.release()
    if recorder is not None:
        recorder.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    main()