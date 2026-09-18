import cv2

camera1 = cv2.VideoCapture(1)
camera2 = cv2.VideoCapture(2)

while True:
    ret1, frame1 = camera1.read()
    ret2, frame2 = camera2.read()

    if ret1:
        cv2.imshow("Camera 1", frame1)

    if ret2:
        cv2.imshow("Camera 2", frame2)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

camera1.release()
camera2.release()

cv2.destroyAllWindows()