from flask import Flask, jsonify
from flask_cors import CORS

from ntes import NTESClient


app = Flask(__name__)
CORS(app)

client = NTESClient()


@app.get("/health")
def health():
    return jsonify({
        "success": True,
        "service": "ntes-service",
        "status": "running"
    })


@app.get("/station/<station_code>")
def station_live(station_code):
    station_code = station_code.strip().upper()

    if not station_code:
        return jsonify({
            "success": False,
            "error": "Station code is required"
        }), 400

    try:
        result = client.station_live(
            station_code,
            hours=4
        )

        return jsonify({
            "success": True,
            "provider": "NTES",
            "station": station_code,
            "data": result
        })

    except Exception as error:
        return jsonify({
            "success": False,
            "provider": "NTES",
            "station": station_code,
            "error": str(error)
        }), 502


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )