import { useEffect, useState } from 'react'

// Fixed prompt used for every generation request. The user does not need to write a prompt.
export const DEFAULT_GENERATION_PROMPT = "Use the uploaded source image as the identity and scene reference, and use the uploaded reference video only as the motion/action reference. Generate a video in which the subject from the source image performs the same actions and movement pattern as the subject in the reference video, matching timing, gestures, body movement, and overall motion as closely as the model allows. PRESERVE THE SOURCE IMAGE AS STRICTLY AS POSSIBLE: keep the original composition, camera angle, framing, aspect ratio, camera-to-subject distance, camera position, background, props, environment, lighting, shadows, brightness, contrast, color temperature, and overall color grading. Do not change the lens or perspective. Do not add, remove, or rearrange objects. Avoid camera movement, zoom, reframing, cropping, scene transitions, flicker, warping, identity drift, extra fingers or limbs, and unintended changes to the background. Change only what is necessary to animate the subject and match the referenced action. Keep every other visual element unchanged. Produce a coherent, natural-looking video with consistent identity across frames."

type TaskResponse = {
  id: string
  status: string
  progress: number
  videoUrl?: string | null
  error?: string | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setUrl(null); return }
    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])
  return url
}

function FileDropCard({ title, description, accept, file, onFileChange, kind }: {
  title: string
  description: string
  accept: string
  file: File | null
  onFileChange: (file: File | null) => void
  kind: 'image' | 'video'
}) {
  const previewUrl = useObjectUrl(file)
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    onFileChange(selected)
    event.target.value = ''
  }
  return (
    <section className="upload-card">
      <div className="upload-card__heading">
        <div>
          <p className="eyebrow">{kind === 'image' ? '01 / SOURCE' : '02 / MOTION REFERENCE'}</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
        <span className="file-icon" aria-hidden="true">{kind === 'image' ? '▧' : '▷'}</span>
      </div>
      <label className="drop-zone">
        {file && previewUrl ? (
          kind === 'image' ? <img className="media-preview" src={previewUrl} alt="Xem trước ảnh nguồn" /> :
            <video className="media-preview" src={previewUrl} controls aria-label="Xem trước video mẫu" />
        ) : (
          <span className="drop-zone__empty">
            <span className="upload-symbol" aria-hidden="true">＋</span>
            <strong>Chọn {kind === 'image' ? 'ảnh' : 'video'} từ máy tính</strong>
            <span className="muted">Nhấn để duyệt file</span>
          </span>
        )}
        <input aria-label={title} type="file" accept={accept} onChange={handleChange} />
      </label>
      {file ? (
        <div className="file-details">
          <div className="file-details__text">
            <strong title={file.name}>{file.name}</strong>
            <span className="muted">{formatBytes(file.size)}</span>
          </div>
          <button className="text-button" type="button" onClick={() => onFileChange(null)}>Xóa file</button>
        </div>
      ) : (
        <p className="hint">{kind === 'image' ? 'Ảnh dùng làm tham chiếu ngoại hình và bối cảnh.' : 'Video dùng làm tham chiếu hành động và chuyển động.'}</p>
      )}
    </section>
  )
}

export default function App() {
  const [image, setImage] = useState<File | null>(null)
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null)
  const [duration, setDuration] = useState('5')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [taskStatus, setTaskStatus] = useState('Chưa tạo')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (!image || !referenceVideo || isGenerating) return
    setIsGenerating(true)
    setProgress(0)
    setTaskStatus('Đang tải file lên')
    setVideoUrl(null)
    setError(null)
    try {
      const form = new FormData()
      form.append('image', image)
      form.append('referenceVideo', referenceVideo)
      form.append('duration', duration)
      form.append('aspectRatio', aspectRatio)
      const createResponse = await fetch('/api/generations', { method: 'POST', body: form })
      if (!createResponse.ok) {
        const body = await createResponse.json().catch(() => null)
        throw new Error(body?.message ?? body?.error ?? 'Không thể bắt đầu tạo video. Hãy kiểm tra backend và API key.')
      }
      const task: TaskResponse = await createResponse.json()
      setTaskStatus('Đang tạo video')
      for (let attempt = 0; attempt < 240; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2500))
        const statusResponse = await fetch(`/api/generations/${encodeURIComponent(task.id)}`)
        if (!statusResponse.ok) {
          const body = await statusResponse.json().catch(() => null)
          throw new Error(body?.message ?? 'Không thể kiểm tra trạng thái tạo video.')
        }
        const status: TaskResponse = await statusResponse.json()
        setProgress(status.progress ?? 0)
        if (status.status === 'SUCCEEDED') {
          setVideoUrl(status.videoUrl ? `${status.videoUrl}?t=${Date.now()}` : null)
          setTaskStatus('Hoàn tất')
          return
        }
        if (status.status === 'FAILED') throw new Error(status.error ?? 'AI không thể tạo video.')
        setTaskStatus(status.status === 'PROCESSING' ? 'AI đang xử lý' : 'Đang chờ xử lý')
      }
      throw new Error('Tác vụ mất quá nhiều thời gian. Bạn có thể thử kiểm tra lại sau.')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Đã xảy ra lỗi không xác định.'
      setError(message)
      setTaskStatus('Có lỗi')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="AI Video Generator trang chủ">
          <span className="brand__mark" aria-hidden="true">✦</span>
          <span>AI VIDEO <strong>STUDIO</strong></span>
        </a>
        <span className="local-pill"><span /> Local workspace</span>
      </header>

      <section className="intro">
        <p className="eyebrow">IMAGE TO VIDEO WORKSPACE</p>
        <h1>Biến ý tưởng thành <span>chuyển động.</span></h1>
        <p className="intro__description">Chỉ cần tải ảnh và video mẫu. Hệ thống tự áp dụng hướng dẫn tạo video đã thiết lập sẵn cho bạn.</p>
      </section>

      <div className="workspace-grid">
        <div className="input-column">
          <div className="section-heading">
            <div><h2>Nguyên liệu đầu vào</h2><p className="muted">Chọn hai file từ máy tính của bạn.</p></div>
            <span className="step-count">02 FILES</span>
          </div>

          <FileDropCard title="Ảnh nguồn" description="Ngoại hình nhân vật và bối cảnh cần giữ lại" accept="image/png,image/jpeg,image/webp" file={image} onFileChange={setImage} kind="image" />
          <FileDropCard title="Video tham chiếu" description="Hành động và chuyển động cần mô phỏng" accept="video/mp4,video/quicktime,video/webm" file={referenceVideo} onFileChange={setReferenceVideo} kind="video" />

          <section className="settings-card">
            <div className="section-heading">
              <div><h2>Thiết lập video</h2><p className="muted">Hướng dẫn AI đã được thiết lập sẵn.</p></div>
              <span className="step-count">AUTO PROMPT</span>
            </div>
            <div className="preset-prompt" role="note">
              <span className="preset-prompt__icon" aria-hidden="true">✦</span>
              <div>
                <strong>Tự động mô phỏng chuyển động</strong>
                <p>Ưu tiên giữ nguyên bố cục, góc máy, tỷ lệ khung hình, khoảng cách camera, ánh sáng, màu sắc, phông nền và các chi tiết môi trường của ảnh gốc. Chỉ thay đổi những gì cần thiết để nhân vật thực hiện hành động trong video mẫu.</p>
              </div>
              <span className="preset-prompt__status">ĐÃ CÀI ĐẶT</span>
            </div>
            <div className="settings-row">
              <div className="field-group">
                <label className="field-label" htmlFor="duration">Thời lượng dự kiến</label>
                <select id="duration" value={duration} onChange={(event) => setDuration(event.target.value)} disabled={isGenerating}>
                  <option value="5">5 giây</option><option value="10">10 giây</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="aspect-ratio">Tỷ lệ khung hình</label>
                <select id="aspect-ratio" value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} disabled={isGenerating}>
                  <option value="9:16">9:16 · Dọc</option><option value="16:9">16:9 · Ngang</option><option value="1:1">1:1 · Vuông</option>
                </select>
              </div>
            </div>
            <div className="notice" role="status">
              <span aria-hidden="true">ⓘ</span>
              <p>{isGenerating ? `${taskStatus} — ${progress}%` : 'Sử dụng Runway Seedance 2.5. File được lưu cục bộ; quá trình tạo video cần kết nối Internet và có thể tiêu tốn credit Runway.'}</p>
            </div>
            {error && <p className="notice" role="alert">{error}</p>}
            <button className="generate-button" type="button" disabled={!image || !referenceVideo || isGenerating} onClick={handleGenerate}>
              <span aria-hidden="true">✦</span>
              {isGenerating ? 'Đang tạo video…' : 'Tạo video AI'}
              <span className="button-tag">{isGenerating ? `${progress}%` : (!image || !referenceVideo ? 'CHỌN ĐỦ 2 FILE' : 'SEEDANCE 2.5')}</span>
            </button>
          </section>
        </div>

        <aside className="result-column">
          <div className="result-panel">
            <div className="result-panel__top">
              <div><p className="eyebrow">OUTPUT PREVIEW</p><h2>Kết quả video</h2></div>
              <span className="status-dot">{taskStatus}</span>
            </div>
            {videoUrl ? (
              <div className="result-placeholder">
                <video className="media-preview" src={videoUrl} controls autoPlay aria-label="Video AI đã tạo" />
                <p>Video đã được tạo thành công</p>
                <a href={videoUrl} download="generated-video.mp4">Mở hoặc tải video</a>
              </div>
            ) : (
              <div className="result-placeholder">
                <div className="preview-orbit preview-orbit--one" /><div className="preview-orbit preview-orbit--two" />
                <div className="preview-symbol" aria-hidden="true">▶</div>
                <p>{isGenerating ? 'AI đang tạo video cho bạn' : 'Video của bạn sẽ xuất hiện tại đây'}</p>
                <span className="muted">{isGenerating ? `Tiến độ: ${progress}%` : 'Đầu ra sẽ được lưu vào thư mục cục bộ'}</span>
              </div>
            )}
            <div className="output-path">
              <span className="folder-symbol" aria-hidden="true">▰</span>
              <div><span className="muted">Thư mục đầu ra</span><strong>data/output/</strong></div>
            </div>
          </div>
          <div className="workflow-note">
            <span className="workflow-note__icon" aria-hidden="true">⌁</span>
            <div><strong>Quy trình cục bộ</strong><p>File được tiếp nhận bởi backend trên máy tính. Không cần database. Để tạo video, ảnh và video tham chiếu sẽ được gửi đến Runway để xử lý.</p></div>
          </div>
        </aside>
      </div>
      <footer className="footer">
        <span>AI VIDEO STUDIO · RUNWAY SEEDANCE 2.5</span>
        <span>Single page · Local file storage · No database</span>
      </footer>
    </main>
  )
}
