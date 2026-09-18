import cv2
import numpy as np

camera = cv2.VideoCapture(1)

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

    contornos, _ = cv2.findContours(
        mascara,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    melhor_contorno = None
    melhor_pontuacao = 0

    for contorno in contornos:

        area = cv2.contourArea(contorno)

        # Ignora objetos pequenos ou enormes
        if area < 500 or area > 20000:
            continue

        perimetro = cv2.arcLength(contorno, True)

        if perimetro == 0:
            continue

        # Mede quão circular é o objeto
        circularidade = (
            4 * np.pi * area / (perimetro * perimetro)
        )

        # 1 = círculo perfeito
        if circularidade < 0.55:
            continue

        (x, y), raio = cv2.minEnclosingCircle(contorno)

        # Filtra por tamanho
        if raio < 10 or raio > 100:
            continue

        # Usa circularidade como pontuação
        if circularidade > melhor_pontuacao:
            melhor_pontuacao = circularidade
            melhor_contorno = contorno

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

            # círculo verde
            cv2.circle(
                frame,
                (int(x), int(y)),
                int(raio),
                (0, 255, 0),
                2
            )

            # centro vermelho
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

            print(
                f"Bola: {centro_x}, {centro_y}"
            )

    cv2.imshow("Camera Frontal", frame)
    cv2.imshow("Mascara", mascara)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

camera.release()
cv2.destroyAllWindows()