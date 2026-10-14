from app.config import load_settings


def test_talk_settings_read_server_env_file(tmp_path, monkeypatch):
    # Өмнө нь ElevenLabs-ийн түлхүүр зөвхөн export хийсэн орчноос уншигддаг, server/.env-ийг үл тоодог байсан.
    for name in ("ELEVENLABS_API_KEY", "ELEVENLABS_API_URL", "ELEVENLABS_STT_PER_HOUR", "CORS_ORIGINS"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".env").write_text(
        "ELEVENLABS_API_KEY=from-file\nELEVENLABS_API_URL=https://api.example\n"
        "ELEVENLABS_STT_PER_HOUR=12\nCORS_ORIGINS=http://a, http://b\n"
    )
    settings = load_settings()
    assert settings.elevenlabs_api_key == "from-file"
    assert settings.elevenlabs_url == "https://api.example"
    assert settings.elevenlabs_stt_per_hour == 12
    assert settings.cors_origins == ("http://a", "http://b")


def test_exported_env_wins_over_file(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".env").write_text("ELEVENLABS_STT_PER_HOUR=12\n")
    monkeypatch.setenv("ELEVENLABS_STT_PER_HOUR", "99")
    assert load_settings().elevenlabs_stt_per_hour == 99
