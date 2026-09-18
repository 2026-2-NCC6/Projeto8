import cv2
import numpy as np

camera = cv2.VideoCapture(2)

# -----------------------------
# ÁREA DO ALVO
# -----------------------------
alvo_x1 = 250
alvo_y1 = 150
alvo_x2 = 450
alvo_y2 = 350

while True:
    ret, frame = camera.read()

    if not ret:
        print("Erro ao acessar a câmera.")
        break

    # Converte para HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Branco = baixa saturação + brilho alto
    limite_inferior = np.array([0, 0, 150])
    limite_superior = np.array([180, 80, 255])

    mascara = cv2.inRange(
        hsv,
        limite_inferior,
        limite_superior
    )

    # Reduz ruído
    kernel = np.ones((5, 5), np.uint8)

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

    # -----------------------------
    # DESENHA O ALVO
    # -----------------------------
    cv2.rectangle(
        frame,
        (alvo_x1, alvo_y1),
        (alvo_x2, alvo_y2),
        (255, 0, 0),
        2
    )

    cv2.putText(
        frame,
        "ALVO",
        (alvo_x1, alvo_y1 - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 0, 0),
        2
    )

    # Procura contornos
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

        perimetro = cv2.arcLength(contorno, True)

        if perimetro == 0:
            continue

        circularidade = (
            4 * np.pi * area / (perimetro * perimetro)
        )

        if circularidade < 0.55:
            continue

        (x, y), raio = cv2.minEnclosingCircle(contorno)

        if raio < 10 or raio > 100:
            continue

        if circularidade > melhor_pontuacao:
            melhor_pontuacao = circularidade
            melhor_contorno = contorno

    # -----------------------------
    # SE A BOLA FOI DETECTADA
    # -----------------------------
    if melhor_contorno is not None:

        (x, y), raio = cv2.minEnclosingCircle(
            melhor_contorno
        )

        momentos = cv2.moments(melhor_contorno)

        if momentos["m00"] != 0:

            centro_x = int(
                momentos["m10"] / momentos["m00"]
            )

            centro_y = int(
                momentos["m01"] / momentos["m00"]
            )

            # Círculo verde em volta da bola
            cv2.circle(
                frame,
                (int(x), int(y)),
                int(raio),
                (0, 255, 0),
                2
            )

            # Centro vermelho
            cv2.circle(
                frame,
                (centro_x, centro_y),
                5,
                (0, 0, 255),
                -1
            )

            cv2.putText(
                frame,
                f"Bola X:{centro_x} Y:{centro_y}",
                (centro_x + 10, centro_y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

            # -----------------------------
            # VERIFICA SE ACERTOU O ALVO
            # -----------------------------
            if (
                alvo_x1 <= centro_x <= alvo_x2
                and
                alvo_y1 <= centro_y <= alvo_y2
            ):

                cv2.putText(
                    frame,
                    "ACERTOU!",
                    (50, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    2,
                    (0, 255, 0),
                    4
                )

                print("ACERTOU!")

            else:
                print(
                    f"Bola: X={centro_x}, Y={centro_y}"
                )

    cv2.imshow("Camera Frontal", frame)
    cv2.imshow("Mascara", mascara)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

camera.release()
cv2.destroyAllWindows()