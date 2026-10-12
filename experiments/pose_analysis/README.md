# MediaPipe Pose Landmarker video prototype

This experiment is isolated from the AutiCare backend/frontend and from the
pbr4RRB project. It extracts landmarks only; it does not detect or classify
autism-related behaviors.

## Environment

Do not install these packages into `pbr4rrb`. The inspected machine currently
has Conda `base` with Python 3.13.9 and `pbr4rrb` with Python 3.8.20. Use a new
environment with CPython 3.11 and the pinned `mediapipe==0.10.21` package
version, which has Windows x86-64 wheels for supported Python versions.

After confirming package availability for your machine, create and populate the
isolated environment manually:

```powershell
conda create -n auticare-pose python=3.11 pip
conda activate auticare-pose
python -m pip install mediapipe==0.10.21
```

OpenCV is installed as a MediaPipe dependency. No PyTorch, CUDA, or model
training is required for this prototype.

## Official model asset

The Pose Landmarker API requires a `.task` model asset. This prototype defaults
to:

```text
experiments/pose_analysis/assets/pose_landmarker_lite.task
```

Use the official Google MediaPipe **Pose Landmarker Lite (float16, model
version 1)** task asset. Download it manually from the official model storage:

<https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task>

The file is approximately 5.6 MB. The expected directory is ignored by Git.
No model asset is included or downloaded by this prototype. The full and heavy
Pose Landmarker model variants are not needed for this first CPU extraction
experiment.

## Run

From the repository root, after installing the package and placing the model
asset in the expected location:

```powershell
conda run -n auticare-pose python experiments\pose_analysis\pose_video_test.py "C:\path\to\one-short-video.mp4"
```

By default, every successfully decoded frame is processed in chronological
order (`--sample-every 1`). The source frame index and source FPS are used to
create monotonically increasing VIDEO-mode timestamps in milliseconds. If
sampling is explicitly configured, both the sampling interval and original
frame indices/timestamps are preserved in the trajectory JSON. Sampling
reduces temporal detail; use the default for the initial temporal experiment.

The compact JSON summary is printed to stdout. Full frame-level trajectories
are written to a timestamped JSON file under `experiments/pose_analysis/outputs/`.
To additionally create an annotated copy for visual checking, add
`--annotated-video`; the input video is never modified:

```powershell
conda run -n auticare-pose python experiments\pose_analysis\pose_video_test.py "C:\path\to\one-short-video.mp4" --annotated-video
```

To use a different official `.task` asset path, pass `--model "C:\path\to\model.task"`.
For explicit frame sampling, pass `--sample-every N`; no frames are skipped
unless this option is supplied.

The JSON reports video metadata, decoded/analyzed frame counts, frames with a
pose, coverage, elapsed time, processing FPS, per-landmark summary statistics,
and the detailed trajectory file path. The detailed file contains normalized
and world coordinates for the selected landmarks and visibility/presence when
the API provides them. Missing detections remain absent; the prototype does
not synthesize landmark values.

## Scope and limitations

- CPU execution and MediaPipe Tasks VIDEO mode.
- One pose per frame, using the Lite model variant.
- Pose detection coverage and coordinates are technical measurements, not
  behavior findings or clinical conclusions.
- A lack of detected pose is reported as `pose_detected: false`; it is not
  interpreted as evidence that a behavior did not occur.
- No behavior thresholds, autism score, or AutiCare API integration are
  implemented.
