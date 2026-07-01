import socket

LISTENING_PORT = 1661

MSG_SIZE = 1024

SERVER_IP = "127.0.0.1"
SERVER_ADDRESS = (SERVER_IP, LISTENING_PORT)


def main() -> None:
    # Boot up and spin up our Node Engine as a subprocess
    print("Starting TypeScript engine core interface...")

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        # Avoid 'address already in use' socket errors on reboots
        sock.connect(SERVER_ADDRESS)
        sock.recv(MSG_SIZE)
        print(f"Connected to competitor opponent engine via: {SERVER_ADDRESS}")

        try:
            while True:
                best_move_raw = input("Enter your move: ")

                # Ship choice data response back to rival remote computer
                sock.sendall((best_move_raw + "\n").encode())
                print(sock.recv(MSG_SIZE).decode())
        except Exception as e:
            print(f"Error handling network traffic exchange: {e}")


if __name__ == "__main__":
    main()
