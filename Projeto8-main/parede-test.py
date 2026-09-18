import cv2
import numpy as np

# =========================
# CÂMERA
# =========================

camera = cv2.VideoCapture(1)

# Se a câmera lateral for outra:
# camera = cv2.VideoCapture(0)
# ou
# camera = cv2.VideoCapture(2)


# =========================
# PONTOS CLICADOS
# =========================

pontos_parede = []
pontos_alvo = []

modo = "parede"


# =========================
# FUNÇÃO DO MOUSE
# =========================

def clique_mouse(event, x, y, flags, param):

    global modo

    if event == cv2.EVENT_LBUTTONDOWN:

        if modo == "parede":

            if len(pontos_parede) < 4:

                pontos_parede.append((x, y))

                print(
                    f"Canto da parede {len(pontos_parede)}: "
                    f"X={x}, Y={y}"
                )

            if len(pontos_parede) == 4:

                print("\nParede definida!")
                print("Agora clique nos 4 cantos do ALVO.\n")

                modo = "alvo"


        elif modo == "alvo":

            if len(pontos_alvo) < 4:

                pontos_alvo.append((x, y))

                print(
                    f"Canto do alvo {len(pontos_alvo)}: "
                    f"X={x}, Y={y}"
                )

            if len(pontos_alvo) == 4:

                print("\nAlvo definido!")
                print("Calibração concluída.\n")

                modo = "pronto"


# =========================
# JANELA
# =========================

cv2.namedWindow("Camera Lateral")

cv2.setMouseCallback(
    "Camera Lateral",
    clique_mouse
)


# =========================
# LOOP
# =========================

while True:

    ret, frame = camera.read()

    if not ret:

        print("Erro ao acessar a câmera.")
        break


    # =================================
    # INSTRUÇÕES NA TELA
    # =================================

    if modo == "parede":

        texto = (
            f"Clique nos cantos da PAREDE "
            f"({len(pontos_parede)}/4)"
        )

    elif modo == "alvo":

        texto = (
            f"Clique nos cantos do ALVO "
            f"({len(pontos_alvo)}/4)"
        )

    else:

        texto = "Calibracao concluida"


    cv2.putText(
        frame,
        texto,
        (20, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2
    )


    # =================================
    # MOSTRA PONTOS DA PAREDE
    # =================================

    for ponto in pontos_parede:

        cv2.circle(
            frame,
            ponto,
            6,
            (255, 0, 0),
            -1
        )


    # Desenha linhas enquanto calibra
    if len(pontos_parede) >= 2:

        pts = np.array(
            pontos_parede,
            np.int32
        )

        cv2.polylines(
            frame,
            [pts],
            len(pontos_parede) == 4,
            (255, 0, 0),
            3
        )


    # =================================
    # MOSTRA PONTOS DO ALVO
    # =================================

    for ponto in pontos_alvo:

        cv2.circle(
            frame,
            ponto,
            6,
            (0, 0, 255),
            -1
        )


    if len(pontos_alvo) >= 2:

        pts_alvo = np.array(
            pontos_alvo,
            np.int32
        )

        cv2.polylines(
            frame,
            [pts_alvo],
            len(pontos_alvo) == 4,
            (0, 0, 255),
            3
        )


    # =================================
    # DETECÇÃO DA BOLA
    # =================================

    hsv = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2HSV
    )

    # Bola branca
    limite_inferior = np.array(
        [0, 0, 150]
    )

    limite_superior = np.array(
        [180, 80, 255]
    )

    mascara = cv2.inRange(
        hsv,
        limite_inferior,
        limite_superior
    )


    kernel = np.ones(
        (5, 5),
        np.uint8
    )


    mascara = cv2.morphologyEx(
        mascara,
        cv2.MORPH_OPEN,
        kernel
    )

    mascara = cv2.morphologyEx(
        mascara,
        cv2.MORPH_CLOSE,
        kernel
    )


    contornos, _ = cv2.findContours(
        mascara,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )


    melhor_contorno = None
    melhor_pontuacao = 0


    for contorno in contornos:

        area = cv2.contourArea(contorno)

        if area < 500 or area > 20000:
            continue


        perimetro = cv2.arcLength(
            contorno,
            True
        )


        if perimetro == 0:
            continue


        circularidade = (
            4 * np.pi * area /
            (perimetro * perimetro)
        )


        if circularidade < 0.55:
            continue


        (x, y), raio = (
            cv2.minEnclosingCircle(contorno)
        )


        if raio < 10 or raio > 100:
            continue


        if circularidade > melhor_pontuacao:

            melhor_pontuacao = circularidade

            melhor_contorno = contorno


    # =================================
    # BOLA ENCONTRADA
    # =================================

    if melhor_contorno is not None:

        (x, y), raio = (
            cv2.minEnclosingCircle(
                melhor_contorno
            )
        )


        momentos = cv2.moments(
            melhor_contorno
        )


        if momentos["m00"] != 0:

            centro_x = int(
                momentos["m10"] /
                momentos["m00"]
            )

            centro_y = int(
                momentos["m01"] /
                momentos["m00"]
            )


            centro = (
                centro_x,
                centro_y
            )


            # Círculo da bola
            cv2.circle(
                frame,
                (int(x), int(y)),
                int(raio),
                (0, 255, 0),
                2
            )


            # Centro da bola
            cv2.circle(
                frame,
                centro,
                5,
                (0, 255, 255),
                -1
            )


            # =================================
            # VERIFICA PAREDE
            # =================================

            if len(pontos_parede) == 4:

                poligono_parede = np.array(
                    pontos_parede,
                    np.int32
                )


                dentro_parede = (
                    cv2.pointPolygonTest(
                        poligono_parede,
                        centro,
                        False
                    )
                )


                if dentro_parede >= 0:

                    cv2.putText(
                        frame,
                        "BOLA NA PAREDE",
                        (20, 70),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (255, 0, 0),
                        2
                    )


            # =================================
            # VERIFICA ALVO
            # =================================

            if len(pontos_alvo) == 4:

                poligono_alvo = np.array(
                    pontos_alvo,
                    np.int32
                )


                dentro_alvo = (
                    cv2.pointPolygonTest(
                        poligono_alvo,
                        centro,
                        False
                    )
                )


                if dentro_alvo >= 0:

                    cv2.putText(
                        frame,
                        "ACERTOU O ALVO!",
                        (20, 110),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 255, 0),
                        3
                    )

                    print(
                        "ACERTOU O ALVO!"
                    )


    # =================================
    # MOSTRA IMAGEM
    # =================================

    cv2.imshow(
        "Camera Lateral",
        frame
    )

    cv2.imshow(
        "Mascara",
        mascara
    )


    tecla = cv2.waitKey(1) & 0xFF


    # Q = sair
    if tecla == ord("q"):
        break


    # R = recalibrar tudo
    if tecla == ord("r"):

        pontos_parede.clear()
        pontos_alvo.clear()

        modo = "parede"

        print("\nCalibracao reiniciada.")
        print(
            "Clique novamente nos "
            "4 cantos da parede.\n"
        )


camera.release()

cv2.destroyAllWindows()