import socket
import subprocess
import sys

LISTENING_PORT = 1661
MSG_SIZE = 1024
NOT_VALID_MOVE = b"That is not a valid format for the move\nfrom:<square>,to:<square>"
EMPTY_MOVE = (-1, -1)
WELCOME_MSG = b"Welcome, are you ready for a chess game against my chess engine?"


def main() -> None:
    print("Starting TypeScript engine core interface...")
    try:
        # Spin up Node Engine as a subprocess
        engine_proc = subprocess.Popen(
            ["npx", "ts-node", "engine.ts"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=False,
        )
    except FileNotFoundError:
        print(
            "Error: Node.js/npx runtime environment not found! Install Node.js to run."
        )
        sys.exit(1)
    except OSError as exc:
        print(f"Error starting Node engine subprocess: {exc}")
        sys.exit(1)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listening_sock:
        listening_sock.bind(("", LISTENING_PORT))
        listening_sock.listen(1)
        print(f"Chess Engine Online Network Server active on port {LISTENING_PORT}...")

        conn, addr = listening_sock.accept()
        print(f"Connected to competitor opponent engine via: {addr}")
        conn.sendall(WELCOME_MSG)

        try:
            while True:
                try:
                    data_bytes = conn.recv(MSG_SIZE)
                except OSError as e:
                    print(f"Socket receive error: {e}")
                    break

                if not data_bytes:  # Handle abrupt disconnect
                    break

                data = data_bytes.decode(errors="replace").strip()
                parsed_data = parse_data(data)
                if parsed_data == EMPTY_MOVE:
                    try:
                        conn.sendall(NOT_VALID_MOVE)
                    except OSError as e:
                        print(f"Socket send error: {e}")
                        break
                    continue

                print(f"Received move match state from opponent: {data}")

                if engine_proc.stdin is None or engine_proc.stdout is None:
                    print("Engine subprocess pipes are unavailable.")
                    break

                engine_proc.stdin.write(data + "\n")
                engine_proc.stdin.flush()

                best_move_raw = engine_proc.stdout.readline()
                if best_move_raw == "":
                    print("Engine subprocess terminated or produced no output.")
                    break

                best_move_raw = best_move_raw.strip()
                print(f"Engine calculated optimal response move: {best_move_raw}")

                try:
                    conn.sendall((best_move_raw + "\n").encode())
                except OSError as e:
                    print(f"Socket send error: {e}")
                    break

        except Exception as e:
            print(f"Error handling network traffic exchange: {e}")
        finally:
            conn.close()
            engine_proc.terminate()
            print("Connection closed and subprocess terminated.")


def parse_data(data: str) -> tuple[int, int]:
    try:
        split_data = data.split(",")
        from_sq, to_sq = int(split_data[0].split(":")[1]), int(
            split_data[1].split(":")[1]
        )
        return (from_sq, to_sq)
    except Exception:
        print("Couldn't parse", data)
        return EMPTY_MOVE


if __name__ == "__main__":
    main()
