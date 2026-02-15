from app import create_app

app = create_app()


def main():
    print("Starting Mistake Tracker...")
    print("Open http://127.0.0.1:5000 in your browser")
    app.run(debug=True, host="127.0.0.1", port=5000)


if __name__ == "__main__":
    main()
