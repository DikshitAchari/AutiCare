import av
import wave

video_path = r"C:\Users\diksh\Downloads\non auti vd2.mp4"
output_path = r"C:\Users\diksh\AppData\Local\Temp\auticare_test.wav"

container = av.open(video_path)
audio_stream = next(s for s in container.streams if s.type == "audio")

resampler = av.audio.resampler.AudioResampler(
    format="s16",
    layout="mono",
    rate=16000
)

wav = wave.open(output_path, "wb")
wav.setnchannels(1)
wav.setsampwidth(2)
wav.setframerate(16000)

samples = 0

for packet in container.demux(audio_stream):
    for frame in packet.decode():
        frames = resampler.resample(frame)

        if not isinstance(frames, list):
            frames = [frames]

        for resampled in frames:
            data = resampled.to_ndarray().tobytes()
            wav.writeframes(data)
            samples += resampled.samples

wav.close()
container.close()

print("Audio extraction successful")
print("Samples:", samples)
print("Duration:", samples / 16000)
print("Output:", output_path)