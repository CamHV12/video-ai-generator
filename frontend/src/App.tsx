import { useEffect, useState } from 'react'

type LocalPreview = {
  file: File
  url: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  return url
}

function FileDropCard({
  title,
  description,
  accept,
  file,
  onFileChange,
  kind,
}: {
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
          kind === 'image' ? (
            <img className="media-preview" src={previewUrl} alt="Xem trước ảnh nguồn" />
          ) : (
            <video className="media-preview" src={previewUrl} controls aria-label="Xem trước video mẫu" />
          )
        ) : (
          <span className="drop-zone__empty">
            <span className="upload-symbol" aria-hidden="true">＋</span>
            <strong>Chọn {kind === 'image' ? 'ảnh' : 'video'} từ máy tính</strong>
            <span className="muted">Nhấn để duyệt file</span>
          </span>
        )}
        <input
          aria-label={title}
          type="file"
          accept={accept}
          onChange={handleChange}
        />
      </label>

      {file ? (
        <div className="file-details">
          <div className="file-details__text">
            <strong title={file.name}>{file.name}</strong>
            <span className="muted">{formatBytes(file.size)}</span>
          </div>
          <button className="text-button" type="button" onClick={() => onFileChange(null)}>
            Xóa file
          </button>
        </div>
      ) : (
        <p className="hint">{kind === 'image' ? 'Định dạng ảnh sẽ được xác thực ở bước upload.' : 'Định dạng và thời lượng được hỗ trợ phụ thuộc model AI.'}</p>
      )}
    </section>
  )
}

export default function App() {
  const [image, setImage] = useState<File | null>(null)
  const [referenceVideo, setReferenceVideo] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState('5')
  const [aspectRatio, setAspectRatio] = useState('9:16')

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
        <p className="intro__description">
          Tải ảnh nguồn và video chuyển động tham chiếu. Chuẩn bị nội dung của bạn trong một không gian sáng tạo duy nhất.
        </p>
      </section>

      <div className="workspace-grid">
        <div className="input-column">
          <div className="section-heading">
            <div>
              <h2>Nguyên liệu đầu vào</h2>
              <p className="muted">Chọn hai file từ máy tính của bạn.</p>
            </div>
            <span className="step-count">02 FILES</span>
          </div>

          <FileDropCard
            title="Ảnh nguồn"
            description="Nhân vật, sản phẩm hoặc đối tượng chính"
            accept="image/png,image/jpeg,image/webp"
            file={image}
            onFileChange={setImage}
            kind="image"
          />
          <FileDropCard
            title="Video tham chiếu"
            description="Chuyển động, tư thế hoặc hướng camera"
            accept="video/mp4,video/quicktime,video/webm"
            file={referenceVideo}
            onFileChange={setReferenceVideo}
            kind="video"
          />

          <section className="settings-card">
            <div className="section-heading">
              <div>
                <h2>Mô tả chuyển động</h2>
                <p className="muted">Mô tả kết quả bạn muốn tạo.</p>
              </div>
            </div>
            <label className="field-label" htmlFor="prompt">Prompt <span>(không bắt buộc)</span></label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ví dụ: Nhân vật bước đi tự nhiên, giữ nguyên ngoại hình, camera di chuyển mượt mà..."
              rows={4}
            />
            <div className="settings-row">
              <div className="field-group">
                <label className="field-label" htmlFor="duration">Thời lượng dự kiến</label>
                <select id="duration" value={duration} onChange={(event) => setDuration(event.target.value)}>
                  <option value="5">5 giây</option>
                  <option value="10">10 giây</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="aspect-ratio">Tỷ lệ khung hình</label>
                <select id="aspect-ratio" value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
                  <option value="9:16">9:16 · Dọc</option>
                  <option value="16:9">16:9 · Ngang</option>
                  <option value="1:1">1:1 · Vuông</option>
                </select>
              </div>
            </div>
            <div className="notice" role="note">
              <span aria-hidden="true">ⓘ</span>
              <p>Chưa kết nối AI ở baseline này. Thời lượng, tỷ lệ và khả năng dùng video tham chiếu sẽ được đối chiếu với API thực tế trước khi bật tạo video.</p>
            </div>
            <button className="generate-button" type="button" disabled>
              <span aria-hidden="true">✦</span>
              Tạo video AI
              <span className="button-tag">SẮP RA MẮT</span>
            </button>
          </section>
        </div>

        <aside className="result-column">
          <div className="result-panel">
            <div className="result-panel__top">
              <div>
                <p className="eyebrow">OUTPUT PREVIEW</p>
                <h2>Kết quả video</h2>
              </div>
              <span className="status-dot">Chưa tạo</span>
            </div>
            <div className="result-placeholder">
              <div className="preview-orbit preview-orbit--one" />
              <div className="preview-orbit preview-orbit--two" />
              <div className="preview-symbol" aria-hidden="true">▶</div>
              <p>Video của bạn sẽ xuất hiện tại đây</p>
              <span className="muted">Đầu ra sẽ được lưu vào thư mục cục bộ</span>
            </div>
            <div className="output-path">
              <span className="folder-symbol" aria-hidden="true">▰</span>
              <div>
                <span className="muted">Thư mục đầu ra</span>
                <strong>data/output/</strong>
              </div>
            </div>
          </div>
          <div className="workflow-note">
            <span className="workflow-note__icon" aria-hidden="true">⌁</span>
            <div>
              <strong>Quy trình cục bộ</strong>
              <p>File được tiếp nhận bởi backend trên máy tính. Không cần database. Khi dùng API trực tuyến, dữ liệu được gửi đến nhà cung cấp AI để xử lý.</p>
            </div>
          </div>
        </aside>
      </div>

      <footer className="footer">
        <span>AI VIDEO STUDIO · PHASE 0 BASELINE</span>
        <span>Single page · Local file storage · No database</span>
      </footer>
    </main>
  )
}
