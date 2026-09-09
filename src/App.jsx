import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  ImagePlus,
  Loader2,
  Sparkles,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Images,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ClipboardCheck,
  Search,
  Play,
  KeyRound,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from './supabase'

const MISSIONS = [
  {
    id: 1,
    title: '새로운 나 발견하기',
    summary: '평소 해보지 않았던 활동 1가지 도전',
    questions: [
      '평소 해보지 않았던 어떤 활동에 도전했나요?',
      '이 활동에 도전해보고 싶었던 이유는 무엇인가요?',
      '직접 해보니 생각했던 것과 달랐던 점이 있었나요?',
    ],
    proof: '활동 모습 또는 결과물 사진',
    minPhotos: 1,
  },
  {
    id: 2,
    title: '30분 몰입 챌린지',
    summary: '스마트폰 없이 30분간 한 가지 활동에 몰입하기',
    questions: [
      '30분 동안 어떤 활동에 집중했나요?',
      '스마트폰 없이 활동해보니 평소와 어떤 점이 달랐나요?',
      '30분 동안 가장 집중이 잘 되었던 순간은 언제였나요?',
    ],
    proof: '활동사진 또는 타이머·시간 확인 화면',
    minPhotos: 1,
  },
  {
    id: 3,
    title: '오늘의 8천보 도전',
    summary: '하루 8,000보 이상 걷기',
    questions: [
      '오늘 어디를 걸었나요?',
      '걸으면서 새롭게 발견하거나 기억에 남았던 것이 있었나요?',
      '8천보를 걸은 뒤 나의 기분이나 몸 상태는 어땠나요?',
    ],
    proof: '걸음 수가 확인되는 앱 화면 캡처',
    minPhotos: 1,
  },
  {
    id: 4,
    title: '우리동네 클린업 챌린지',
    summary: '우리동네 쓰레기 20개 이상 줍기',
    questions: [
      '어디에서 클린업 활동을 했나요?',
      '가장 많이 발견한 쓰레기는 무엇이었나요?',
      '우리동네를 더 깨끗하게 만들기 위해 필요한 것은 무엇이라고 생각하나요?',
    ],
    proof: '활동사진 + 수거한 쓰레기 사진',
    minPhotos: 2,
  },
  {
    id: 5,
    title: '일회용품 없는 하루',
    summary: '하루 동안 일회용품 사용 줄이기',
    questions: [
      '오늘 사용하지 않은 일회용품은 무엇인가요?',
      '대신 어떤 물건이나 방법을 사용했나요?',
      '일회용품 없이 생활하며 가장 어려웠던 점은 무엇이었나요?',
    ],
    proof: '텀블러, 다회용기, 장바구니 등 실천사진',
    minPhotos: 1,
  },
  {
    id: 6,
    title: '우리동네 보물찾기',
    summary: '평소 몰랐던 우리동네 장소 1곳 발견하기',
    questions: [
      '새롭게 발견한 장소는 어디인가요?',
      '이 장소에서 새롭게 알게 된 것은 무엇인가요?',
      '친구에게 이곳을 추천한다면 어떤 이유로 추천하고 싶나요?',
    ],
    proof: '장소가 확인되는 현장사진',
    minPhotos: 1,
  },
  {
    id: 7,
    title: '동네 한 바퀴 관찰단',
    summary: '우리동네의 좋은 점과 아쉬운 점 발견하기',
    questions: [
      '우리동네를 둘러보며 발견한 좋은 점은 무엇인가요?',
      '조금 바뀌었으면 좋겠다고 생각한 점은 무엇인가요?',
      '어떻게 바뀌면 더 좋은 동네가 될까요?',
    ],
    proof: '관찰한 장소 사진',
    minPhotos: 1,
  },
  {
    id: 8,
    title: '생활 속 불편 탐정단',
    summary: '생활 속 불편한 점 1가지 찾아보기',
    questions: [
      '생활하면서 어떤 불편함을 발견했나요?',
      '누가, 언제 이 문제 때문에 불편할 것 같나요?',
      '이 문제를 해결할 수 있는 방법을 하나 제안해주세요.',
    ],
    proof: '문제 상황이 확인되는 사진 또는 직접 작성한 설명',
    minPhotos: 0,
  },
]

const LEVELS = ['골드', '플래티넘', '마스터', '드림']

const INITIAL_FORM = {
  name: '',
  phone: '',
  level: '',
  checkCode: '',
  activityDate: new Date().toISOString().slice(0, 10),
  answers: ['', '', ''],
  explanation: '',
  consent: false,
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function safeFileName(name) {
  const cleaned = name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned || 'image'
}

async function compressImage(file) {
  const MAX_DIMENSION = 1600
  const JPEG_QUALITY = 0.82
  const SKIP_UNDER_BYTES = 700 * 1024

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.decoding = 'async'

    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'))
      image.src = objectUrl
    })

    const originalWidth = image.naturalWidth
    const originalHeight = image.naturalHeight
    const longestSide = Math.max(originalWidth, originalHeight)

    if (file.size <= SKIP_UNDER_BYTES && longestSide <= MAX_DIMENSION) {
      return file
    }

    const scale = longestSide > MAX_DIMENSION ? MAX_DIMENSION / longestSide : 1
    const width = Math.max(1, Math.round(originalWidth * scale))
    const height = Math.max(1, Math.round(originalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('이미지 압축을 준비할 수 없습니다.')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('이미지 압축에 실패했습니다.')),
        'image/jpeg',
        JPEG_QUALITY,
      )
    })

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File(
      [blob],
      `${baseName}.jpg`,
      { type: 'image/jpeg', lastModified: Date.now() },
    )
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}


async function makeVerificationHash(name, phone, level, checkCode) {
  const normalizedName = name.trim().replace(/\s+/g, ' ')
  const normalizedPhone = phone.replace(/\D/g, '')
  const raw = `${normalizedName}|${normalizedPhone}|${level}|${checkCode}`
  const encoded = new TextEncoder().encode(raw)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function App() {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return <AdminPage />
  if (path.startsWith('/check')) return <SubmissionCheckPage />
  if (path.startsWith('/submit')) return <MissionSubmitPage />
  return <LandingPage />
}

function MissionSubmitPage() {
  const [step, setStep] = useState(1)
  const [selectedMissionId, setSelectedMissionId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const mission = useMemo(
    () => MISSIONS.find((item) => item.id === selectedMissionId) ?? null,
    [selectedMissionId],
  )

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [photos])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const setAnswer = (index, value) => {
    setForm((prev) => {
      const next = [...prev.answers]
      next[index] = value
      return { ...prev, answers: next }
    })
    setError('')
  }

  const goToStep2 = () => {
    if (!mission) {
      setError('먼저 도전할 미션을 선택해주세요.')
      return
    }
    setError('')
    setStep(2)
  }

  const goToStep3 = () => {
    if (!form.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    if (!/^010-\d{4}-\d{4}$/.test(form.phone)) {
      setError('연락처를 010-0000-0000 형식으로 입력해주세요.')
      return
    }
    if (!LEVELS.includes(form.level)) {
      setError('참여 레벨을 선택해주세요.')
      return
    }
    if (!/^\d{6}$/.test(form.checkCode)) {
      setError('제출확인 번호를 숫자 6자리로 입력해주세요.')
      return
    }
    setError('')
    setStep(3)
  }

  const handleFiles = async (event) => {
    const incoming = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!incoming.length) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    for (const file of incoming) {
      if (!allowed.includes(file.type)) {
        setError('JPG, JPEG, PNG, WEBP 이미지 파일만 업로드할 수 있어요.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('원본 사진은 한 장당 최대 10MB까지 선택할 수 있어요.')
        return
      }
    }

    const availableSlots = Math.max(0, 3 - photos.length)
    const targets = incoming.slice(0, availableSlots)
    if (!targets.length) return

    setIsProcessingPhotos(true)
    setError('')

    try {
      const compressed = []
      for (const file of targets) {
        compressed.push(await compressImage(file))
      }

      setPhotos((prev) => [...prev, ...compressed].slice(0, 3))
    } catch (err) {
      console.error('이미지 압축 오류:', err)
      setError('사진 처리 중 오류가 발생했습니다. 다른 사진으로 다시 시도해주세요.')
    } finally {
      setIsProcessingPhotos(false)
    }
  }

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const validateSubmission = () => {
    if (!mission) return '미션을 선택해주세요.'
    if (!form.activityDate) return '활동일을 선택해주세요.'
    if (form.answers.some((answer) => !answer.trim())) return '질문 3개에 모두 답해주세요.'
    if (photos.length > 3) return '인증사진은 최대 3장까지 업로드할 수 있어요.'

    if (mission.id === 4 && photos.length < 2) {
      return '우리동네 클린업 챌린지는 인증사진을 최소 2장 업로드해주세요.'
    }
    if (mission.id !== 8 && photos.length < mission.minPhotos) {
      return '인증사진을 최소 1장 업로드해주세요.'
    }
    if (mission.id === 8 && photos.length === 0 && !form.explanation.trim()) {
      return '사진이 없다면 인증 설명을 작성해주세요.'
    }
    if (!form.consent) return '개인정보 및 인증자료 제출 안내에 동의해주세요.'
    return ''
  }

  const handleSubmit = async () => {
    if (isSubmitting || isProcessingPhotos) return
    const validationError = validateSubmission()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const uploadedPaths = []

      for (const file of photos) {
        const path = `mission-${mission.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`
        const { error: uploadError } = await supabase.storage
          .from('mission-photos')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })

        if (uploadError) throw uploadError
        uploadedPaths.push(path)
      }

      const verificationHash = await makeVerificationHash(
        form.name,
        form.phone,
        form.level,
        form.checkCode,
      )

      const { error: insertError } = await supabase.from('submissions').insert({
        participant_name: form.name.trim(),
        phone: form.phone,
        level: form.level,
        verification_hash: verificationHash,
        mission_id: mission.id,
        activity_date: form.activityDate,
        answer_1: form.answers[0].trim(),
        answer_2: form.answers[1].trim(),
        answer_3: form.answers[2].trim(),
        comment: mission.id === 8 && photos.length === 0 ? form.explanation.trim() : null,
        photo_paths: JSON.stringify(uploadedPaths),
        status: '접수',
      })

      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err) {
      console.error('추가미션 제출 오류:', err)
      setError('제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetAll = () => {
    setStep(1)
    setSelectedMissionId(null)
    setForm(INITIAL_FORM)
    setPhotos([])
    setError('')
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="site-shell">
        <Header />
        <main className="success-wrap">
          <section className="success-card">
            <div className="success-icon"><Check size={34} strokeWidth={2.3} /></div>
            <p className="eyebrow">MISSION COMPLETE</p>
            <h1>추가미션 인증이 접수되었습니다!</h1>
            <p>담당자 확인 후 점수에 반영됩니다.</p>
            <div className="success-actions">
              <button className="primary-button success-button" onClick={resetAll}>
                다른 미션 도전하기 <ArrowRight size={18} />
              </button>
              <a className="ghost-button success-link" href="/check">
                제출 확인하기 <ClipboardCheck size={18} />
              </a>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="site-shell">
      <Header />
      <main className="page-grid">
        <aside className="intro-panel">
          <div>
            <p className="eyebrow"><Sparkles size={15} /> EXTRA MISSION</p>
            <h1 className="hero-title">
              <span className="desktop-title">
                시흥시<br />
                으뜸성장챌린지<br />
                추가미션
              </span>
              <span className="mobile-title">
                시흥시<br />
                으뜸성장챌린지<br />
                추가미션
              </span>
            </h1>
            <details className="score-notice" open={false}>
              <summary>
                <span className="notice-summary-text">
                  <strong className="notice-open">🎯 추가미션 OPEN!</strong>
                  <span className="score-lines">
                    <span>미션 1개 완료 시 <b>+2점</b>,</span>
                    <span>최대 5개 참여 시 <b>총 +10점</b></span>
                  </span>
                  <span>
                    추가점수는 기본 활동비 수여 기준 점수에는 포함되지만,
                    <strong> 1~2위 상위 활동비 순위 산정에는 반영되지 않습니다.</strong>
                  </span>
                </span>
                <span className="notice-more">자세히 보기</span>
              </summary>

              <div className="notice-detail">
                <p><strong>으뜸성장챌린지, 아직 끝난 거 아니죠? 😎</strong><br />지속적인 참여를 응원하기 위한 <b>추가미션</b>이 열렸습니다!</p>
                <p>일상 속에서 내가 할 수 있는 작은 도전을 직접 고르고, 하나씩 실천하며 <strong>나만의 성장경험을 더 채워보세요! 🌱</strong></p>
                <p>미션 1개를 완료할 때마다 <strong>+2점!</strong><br />최대 5개까지 참여하면 <strong>총 +10점</strong>을 받을 수 있어요. 🙌</p>
                <p className="mission-flow"><strong>도전하고 → 인증하고 → 성장점수까지 GET!</strong></p>

                <div className="notice-divider" />
                <p className="notice-subtitle">💡 추가점수는 이렇게 적용돼요!</p>
                <p>추가미션 점수는 <strong>기본 활동비 수여 기준을 충족하기 위한 점수에는 포함</strong>됩니다.</p>
                <p>다만, <strong>점수 순위에 따라 지급되는 상위 활동비 산정에는 포함되지 않아요!</strong></p>

                <div className="notice-example">
                  <strong>예시 👀</strong>
                  <span>기존 활동점수 <b>55점</b> + 추가미션 <b>10점</b> = 총 <b>65점</b></span>
                  <span>✅ 기본 활동비 <b>10만원 수여 가능!</b></span>
                  <span>❌ 1~2위 순위 산정 시에는 추가미션 점수를 제외한 <b>기존 활동점수 55점</b>을 기준으로 합니다.</span>
                </div>

                <p>따라서 추가미션 점수를 포함해 1~2위가 되더라도 <strong>1위 40만원 / 2위 30만원의 상위 활동비 대상에는 해당되지 않습니다.</strong></p>
                <p className="notice-closing">✨ 작은 도전도 쌓이면 멋진 성장기록이 됩니다.<br /><strong>내가 고른 미션으로 으뜸성장챌린지를 끝까지 완주해보세요!</strong></p>
              </div>
            </details>
          </div>
          <div className="intro-footnote">
            작은 도전을 선택하고, 기록하고, 인증해보세요.
          </div>
        </aside>

        <section className="form-panel">
          <Stepper step={step} />

          {step === 1 && (
            <div className="step-content">
              <div className="section-heading">
                <span>STEP 1</span>
                <h2>도전할 미션을 선택해주세요</h2>
                <p>총 8개의 추가미션 중 하나를 선택하세요.</p>
              </div>

              <div className="mission-grid">
                {MISSIONS.map((item) => {
                  const active = selectedMissionId === item.id
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`mission-card ${active ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMissionId(item.id)
                        setError('')
                      }}
                    >
                      <span className="mission-number">{String(item.id).padStart(2, '0')}</span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                      </div>
                      {active && <Check className="mission-check" size={20} />}
                    </button>
                  )
                })}
              </div>

              {error && <ErrorBox message={error} />}
              <div className="action-row right">
                <button className="primary-button" onClick={goToStep2}>
                  다음 <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content narrow">
              <div className="section-heading">
                <span>STEP 2</span>
                <h2>참가자 정보를 입력해주세요</h2>
                <p>인증 확인을 위한 기본 정보입니다.</p>
              </div>

              <div className="selected-mission-strip">
                <span>{String(mission?.id).padStart(2, '0')}</span>
                <div><strong>{mission?.title}</strong><small>{mission?.summary}</small></div>
              </div>

              <label className="field-label">
                <span className="field-title">이름 <em>*</em></span>
                <input
                  className="text-input"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="이름을 입력해주세요"
                  autoComplete="name"
                />
              </label>

              <label className="field-label">
                <span className="field-title">연락처 <em>*</em></span>
                <input
                  className="text-input"
                  value={form.phone}
                  onChange={(e) => setField('phone', formatPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </label>

              <label className="field-label">
                <span className="field-title">참여 레벨 <em>*</em></span>
                <select
                  className="text-input select-input"
                  value={form.level}
                  onChange={(e) => setField('level', e.target.value)}
                >
                  <option value="">레벨을 선택해주세요</option>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                <span className="field-title">제출확인 번호 <em>*</em></span>
                <input
                  className="text-input"
                  value={form.checkCode}
                  onChange={(e) => setField('checkCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="숫자 6자리를 정해주세요"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                />
                <small className="field-help">
                  제출현황을 확인할 때 사용하는 번호예요. 다른 미션을 제출할 때도 같은 번호를 사용해주세요.
                </small>
              </label>

              {error && <ErrorBox message={error} />}
              <div className="action-row split">
                <button className="ghost-button" onClick={() => { setStep(1); setError('') }}>
                  <ArrowLeft size={18} /> 이전
                </button>
                <button className="primary-button" onClick={goToStep3}>
                  다음 <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && mission && (
            <div className="step-content narrow">
              <div className="section-heading">
                <span>STEP 3</span>
                <h2>미션 인증 내용을 작성해주세요</h2>
                <p>도전의 과정과 결과를 기록해주세요.</p>
              </div>

              <div className="selected-mission-strip detailed">
                <span>{String(mission.id).padStart(2, '0')}</span>
                <div><strong>{mission.title}</strong><small>{mission.summary}</small></div>
              </div>

              <label className="field-label">
                <span className="field-title">활동일 <em>*</em></span>
                <input
                  type="date"
                  className="text-input"
                  value={form.activityDate}
                  onChange={(e) => setField('activityDate', e.target.value)}
                />
              </label>

              <div className="questions-stack">
                {mission.questions.map((question, index) => (
                  <label className="field-label" key={question}>
                    <span className="field-title question-title">
                      <span className="question-number">Q{index + 1}</span>
                      <span>{question}</span>
                      <em>*</em>
                    </span>
                    <textarea
                      className="text-area"
                      rows={3}
                      value={form.answers[index]}
                      onChange={(e) => setAnswer(index, e.target.value)}
                      placeholder="내용을 입력해주세요"
                    />
                  </label>
                ))}
              </div>

              <div className="proof-box">
                <div><ImagePlus size={20} /></div>
                <p><strong>인증방법</strong><span>{mission.proof}</span></p>
              </div>

              <div className="upload-section">
                <div className="upload-head">
                  <div>
                    <strong className="field-title upload-title">
                      인증사진 {mission.id === 8 ? null : <em>*</em>}
                    </strong>
                    <span>JPG · JPEG · PNG · WEBP / 원본 장당 최대 10MB / 최대 3장 · 선택 후 자동 압축</span>
                  </div>
                  <span>{photos.length}/3</span>
                </div>

                <label className={`upload-drop ${photos.length >= 3 || isProcessingPhotos ? 'disabled' : ''}`}>
                  {isProcessingPhotos ? <Loader2 className="spin" size={24} /> : <Upload size={24} />}
                  <strong>{isProcessingPhotos ? '사진 압축 중...' : '사진 선택하기'}</strong>
                  <span>{isProcessingPhotos ? '잠시만 기다려주세요.' : '휴대폰 사진 또는 캡처 이미지를 선택해주세요.'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFiles}
                    disabled={photos.length >= 3 || isProcessingPhotos}
                  />
                </label>

                {previews.length > 0 && (
                  <div className="preview-grid">
                    {previews.map((src, index) => (
                      <div className="preview-item" key={src}>
                        <img src={src} alt={`인증사진 ${index + 1}`} />
                        <button type="button" aria-label="사진 삭제" onClick={() => removePhoto(index)}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {mission.id === 8 && photos.length === 0 && (
                <label className="field-label">
                  <span className="field-title">인증 설명 <em>*</em></span>
                  <textarea
                    className="text-area"
                    rows={4}
                    value={form.explanation}
                    onChange={(e) => setField('explanation', e.target.value)}
                    placeholder="사진 대신 문제 상황을 자세히 설명해주세요."
                  />
                </label>
              )}

              <label className="consent-row">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setField('consent', e.target.checked)}
                />
                <span>제출한 개인정보와 인증자료가 추가미션 확인 및 점수 반영을 위해 사용되는 것에 동의합니다. <em>*</em></span>
              </label>

              {error && <ErrorBox message={error} />}
              <div className="action-row split final-actions">
                <button className="ghost-button" onClick={() => { setStep(2); setError('') }} disabled={isSubmitting}>
                  <ArrowLeft size={18} /> 이전
                </button>
                <button className="primary-button submit-button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={18} className="spin" /> 제출 중...</> : <>추가미션 인증 제출하기 <ArrowRight size={18} /></>}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}


function LandingPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="home-page">
        <section className="home-hero">
          <p className="eyebrow"><Sparkles size={15} /> EXTRA MISSION</p>
          <h1>시흥시<br />으뜸성장챌린지<br />추가미션</h1>
          <p>도전하고, 기록하고, 내가 제출한 미션의 확인상태까지 한곳에서 확인해보세요.</p>
        </section>

        <section className="home-actions">
          <a className="home-action-card primary" href="/submit">
            <span className="home-action-icon"><Play size={27} /></span>
            <div>
              <strong>미션하러 가기</strong>
              <p>8개의 추가미션 중 하나를 선택해 도전하고 인증해요.</p>
            </div>
            <ArrowRight size={22} />
          </a>

          <a className="home-action-card" href="/check">
            <span className="home-action-icon"><ClipboardCheck size={27} /></span>
            <div>
              <strong>제출 확인하기</strong>
              <p>내가 제출한 미션과 담당자 확인상태를 확인해요.</p>
            </div>
            <ArrowRight size={22} />
          </a>
        </section>

        <p className="home-note">
          제출확인 시 이름, 연락처, 레벨과 직접 설정한 6자리 제출확인 번호가 필요합니다.
        </p>
      </main>
    </div>
  )
}

function SubmissionCheckPage() {
  const [form, setForm] = useState({ name: '', phone: '', level: '', checkCode: '' })
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const lookup = async (event) => {
    event.preventDefault()
    setError('')
    setSearched(false)

    if (!form.name.trim()) return setError('이름을 입력해주세요.')
    if (!/^010-\d{4}-\d{4}$/.test(form.phone)) return setError('연락처를 010-0000-0000 형식으로 입력해주세요.')
    if (!LEVELS.includes(form.level)) return setError('참여 레벨을 선택해주세요.')
    if (!/^\d{6}$/.test(form.checkCode)) return setError('제출확인 번호 6자리를 입력해주세요.')

    setLoading(true)
    try {
      const verificationHash = await makeVerificationHash(form.name, form.phone, form.level, form.checkCode)
      const { data, error: lookupError } = await supabase.rpc('lookup_my_submissions', {
        p_hash: verificationHash,
      })
      if (lookupError) throw lookupError
      setResults(data ?? [])
      setSearched(true)
    } catch (err) {
      console.error('제출현황 확인 오류:', err)
      setError('제출현황을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="site-shell">
      <Header />
      <main className="check-page">
        <section className="check-card">
          <div className="check-heading">
            <p className="eyebrow"><ClipboardCheck size={15} /> SUBMISSION CHECK</p>
            <h1>내 미션 제출현황 확인</h1>
            <p>제출할 때 입력한 정보와 제출확인 번호를 입력해주세요.</p>
          </div>

          <form className="check-form" onSubmit={lookup}>
            <div className="check-form-grid">
              <label className="field-label">
                <span className="field-title">이름 <em>*</em></span>
                <input className="text-input" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="이름을 입력해주세요" />
              </label>

              <label className="field-label">
                <span className="field-title">연락처 <em>*</em></span>
                <input className="text-input" value={form.phone} onChange={(e) => setField('phone', formatPhone(e.target.value))} placeholder="010-0000-0000" inputMode="numeric" />
              </label>

              <label className="field-label">
                <span className="field-title">참여 레벨 <em>*</em></span>
                <select className="text-input select-input" value={form.level} onChange={(e) => setField('level', e.target.value)}>
                  <option value="">레벨을 선택해주세요</option>
                  {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>

              <label className="field-label">
                <span className="field-title">제출확인 번호 <em>*</em></span>
                <div className="check-code-input-wrap">
                  <KeyRound size={18} />
                  <input className="text-input" value={form.checkCode} onChange={(e) => setField('checkCode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="숫자 6자리" inputMode="numeric" maxLength={6} />
                </div>
              </label>
            </div>

            {error && <ErrorBox message={error} />}
            <div className="check-form-actions">
              <a className="ghost-button" href="/"><ArrowLeft size={17} /> 처음으로</a>
              <button className="primary-button" disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> 확인 중...</> : <><Search size={18} /> 제출현황 확인</>}
              </button>
            </div>
          </form>
        </section>

        {searched && (
          <section className="check-results">
            <div className="check-results-heading">
              <div>
                <h2>제출한 미션</h2>
                <p>총 {results.length}건의 제출내역을 확인했습니다.</p>
              </div>
              <a href="/submit" className="primary-button check-new-mission">미션하러 가기 <ArrowRight size={17} /></a>
            </div>

            {results.length === 0 ? (
              <div className="check-empty">
                <ClipboardCheck size={28} />
                <strong>일치하는 제출내역이 없습니다.</strong>
                <p>입력정보와 제출확인 번호가 맞는지 다시 확인해주세요.</p>
              </div>
            ) : (
              <div className="check-result-list">
                {results.map((record) => {
                  const mission = MISSIONS.find((item) => item.id === Number(record.mission_id))
                  const checked = record.status === '확인'
                  return (
                    <article className="check-result-row" key={record.submission_id}>
                      <span className="check-mission-number">{String(record.mission_id).padStart(2, '0')}</span>
                      <div className="check-result-copy">
                        <strong>{mission?.title ?? `미션 ${record.mission_id}`}</strong>
                        <span>활동일 {record.activity_date || '-'}</span>
                        <span>제출일 {formatDateTime(record.created_at)}</span>
                      </div>
                      <span className={`check-status ${checked ? 'checked' : 'waiting'}`}>
                        {checked ? <Check size={15} /> : <Loader2 size={15} />}
                        {checked ? '미션 확인' : '확인 대기'}
                      </span>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}


function AdminPage() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setCheckingSession(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (checkingSession) {
    return (
      <div className="admin-shell admin-center">
        <Loader2 className="spin" size={28} />
        <p>관리자 정보를 확인하고 있어요.</p>
      </div>
    )
  }

  return session ? <AdminDashboard session={session} /> : <AdminLogin />
}

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (event) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (loginError) setError('관리자 로그인에 실패했습니다. 계정 정보를 확인해주세요.')
    setLoading(false)
  }

  return (
    <div className="admin-shell admin-login-wrap">
      <section className="admin-login-card">
        <div className="admin-login-icon"><LockKeyhole size={28} /></div>
        <p className="eyebrow">ADMIN</p>
        <h1>추가미션 관리자</h1>
        <p className="admin-muted">승인된 관리자 계정으로 로그인해주세요.</p>
        <form onSubmit={login} className="admin-login-form">
          <label className="field-label">
            <span className="field-title">이메일</span>
            <input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="field-label">
            <span className="field-title">비밀번호</span>
            <input className="text-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <ErrorBox message={error} />}
          <button className="primary-button admin-login-button" disabled={loading}>
            {loading ? <><Loader2 size={18} className="spin" /> 로그인 중...</> : <><ShieldCheck size={18} /> 관리자 로그인</>}
          </button>
        </form>
        <a href="/" className="admin-back-link">참가자 제출페이지로 돌아가기</a>
      </section>
    </div>
  )
}

function AdminDashboard({ session }) {
  const PAGE_SIZE = 10
  const [missionFilter, setMissionFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ all: 0 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [photoViewer, setPhotoViewer] = useState(null)
  const [detailRecord, setDetailRecord] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  const missionMap = useMemo(
    () => Object.fromEntries(MISSIONS.map((item) => [item.id, item])),
    [],
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const parsePaths = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const attachPhotoUrls = async (rows) => {
    return Promise.all(rows.map(async (row) => {
      const photoPaths = parsePaths(row.photo_paths)
      if (!photoPaths.length) return { ...row, photoPaths, photoUrls: [] }

      const { data, error: signedError } = await supabase.storage
        .from('mission-photos')
        .createSignedUrls(photoPaths, 60 * 30)

      if (signedError) {
        console.error('사진 URL 생성 오류:', signedError)
        return { ...row, photoPaths, photoUrls: [] }
      }

      return {
        ...row,
        photoPaths,
        photoUrls: (data ?? []).map((item) => item.signedUrl).filter(Boolean),
      }
    }))
  }

  const fetchCounts = async () => {
    const queries = [
      supabase.from('submissions').select('*', { count: 'exact', head: true }),
      ...MISSIONS.map((mission) =>
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('mission_id', mission.id),
      ),
    ]
    const results = await Promise.all(queries)
    const next = { all: results[0].count ?? 0 }
    MISSIONS.forEach((mission, index) => {
      next[mission.id] = results[index + 1].count ?? 0
    })
    setCounts(next)
  }

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (missionFilter !== 'all') query = query.eq('mission_id', Number(missionFilter))

    const { data, count, error: queryError } = await query
    if (queryError) {
      console.error('관리자 실적 조회 오류:', queryError)
      setError('실적자료를 불러오지 못했습니다. 관리자 권한과 RLS 설정을 확인해주세요.')
      setRecords([])
      setTotal(0)
      setLoading(false)
      return
    }

    setRecords(await attachPhotoUrls(data ?? []))
    setTotal(count ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [missionFilter, page])

  const changeMission = (value) => {
    setMissionFilter(value)
    setPage(1)
  }

  const refresh = async () => {
    await Promise.all([fetchCounts(), fetchRecords()])
  }

  const fetchAllForExport = async () => {
    const chunkSize = 1000
    let from = 0
    let all = []

    while (true) {
      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + chunkSize - 1)

      if (missionFilter !== 'all') query = query.eq('mission_id', Number(missionFilter))
      const { data, error: exportError } = await query
      if (exportError) throw exportError
      all = all.concat(data ?? [])
      if (!data || data.length < chunkSize) break
      from += chunkSize
    }
    return all
  }

  const exportExcel = async () => {
    setExporting(true)
    setError('')
    try {
      const rows = await fetchAllForExport()
      const excelRows = rows.map((row, index) => {
        const paths = parsePaths(row.photo_paths)
        return {
          순번: index + 1,
          제출일시: formatDateTime(row.created_at),
          미션번호: row.mission_id,
          미션명: missionMap[row.mission_id]?.title ?? '',
          이름: row.participant_name ?? '',
          연락처: row.phone ?? '',
          레벨: row.level ?? '',
          활동일: row.activity_date ?? '',
          질문1답변: row.answer_1 ?? '',
          질문2답변: row.answer_2 ?? '',
          질문3답변: row.answer_3 ?? '',
          인증설명: row.comment ?? '',
          상태: row.status ?? '',
          사진1경로: paths[0] ?? '',
          사진2경로: paths[1] ?? '',
          사진3경로: paths[2] ?? '',
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(excelRows)
      worksheet['!cols'] = [
        { wch: 7 }, { wch: 20 }, { wch: 9 }, { wch: 24 }, { wch: 12 }, { wch: 16 },
        { wch: 12 }, { wch: 12 }, { wch: 45 }, { wch: 45 }, { wch: 45 }, { wch: 35 },
        { wch: 10 }, { wch: 45 }, { wch: 45 }, { wch: 45 },
      ]
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '추가미션 실적')
      const missionName = missionFilter === 'all'
        ? '전체'
        : `미션${missionFilter}_${missionMap[Number(missionFilter)]?.title ?? ''}`
      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(workbook, `으뜸성장챌린지_추가미션_${missionName}_${date}.xlsx`)
    } catch (err) {
      console.error('엑셀 다운로드 오류:', err)
      setError('엑셀 파일을 만드는 중 오류가 발생했습니다.')
    } finally {
      setExporting(false)
    }
  }

  const updateStatus = async (record, nextStatus) => {
    if (!['접수', '확인'].includes(nextStatus)) return
    setUpdatingStatusId(record.id)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ status: nextStatus })
        .eq('id', record.id)

      if (updateError) throw updateError

      setRecords((prev) => prev.map((item) => item.id === record.id ? { ...item, status: nextStatus } : item))
      setDetailRecord((prev) => prev?.id === record.id ? { ...prev, status: nextStatus } : prev)
    } catch (err) {
      console.error('상태 변경 오류:', err)
      setError('상태를 변경하지 못했습니다. 관리자 UPDATE 정책을 확인해주세요.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const downloadPhoto = async (url, record, index) => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('사진 다운로드에 실패했습니다.')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safeName = (record?.participant_name || 'participant').replace(/[^0-9a-zA-Z가-힣_-]/g, '_')
      const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
      link.href = objectUrl
      link.download = `${safeName}_미션${record?.mission_id ?? ''}_인증사진${index + 1}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.error('사진 다운로드 오류:', err)
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow"><ShieldCheck size={15} /> ADMIN DASHBOARD</p>
          <h1>추가미션 제출현황</h1>
          <p className="admin-muted">미션별 최근 제출순으로 10건씩 확인할 수 있습니다.</p>
        </div>
        <div className="admin-header-actions">
          <span className="admin-email">{session.user.email}</span>
          <button className="ghost-button" onClick={logout}><LogOut size={16} /> 로그아웃</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-stats">
          <button className={`admin-stat-card ${missionFilter === 'all' ? 'active' : ''}`} onClick={() => changeMission('all')}>
            <strong>전체</strong><b>{counts.all ?? 0}</b><span>건</span>
          </button>
          {MISSIONS.map((mission) => (
            <button key={mission.id} className={`admin-stat-card ${Number(missionFilter) === mission.id ? 'active' : ''}`} onClick={() => changeMission(String(mission.id))}>
              <strong>{String(mission.id).padStart(2, '0')}</strong>
              <b>{counts[mission.id] ?? 0}</b><span>건</span>
              <small>{mission.title}</small>
            </button>
          ))}
        </section>

        <section className="admin-toolbar">
          <div>
            <h2>{missionFilter === 'all' ? '전체 미션' : missionMap[Number(missionFilter)]?.title}</h2>
            <p>제출일 최신순 · 페이지당 최대 10명</p>
          </div>
          <div className="admin-toolbar-actions">
            <button className="ghost-button" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> 새로고침</button>
            <button className="primary-button" onClick={exportExcel} disabled={exporting}>
              {exporting ? <><Loader2 size={16} className="spin" /> 엑셀 생성 중</> : <><Download size={16} /> 엑셀 다운로드</>}
            </button>
          </div>
        </section>

        {error && <ErrorBox message={error} />}

        {loading ? (
          <div className="admin-empty"><Loader2 size={26} className="spin" /><p>제출현황을 불러오는 중입니다.</p></div>
        ) : records.length === 0 ? (
          <div className="admin-empty"><Images size={30} /><p>아직 제출된 실적이 없습니다.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>제출일시</th>
                  <th>미션</th>
                  <th>이름</th>
                  <th>레벨</th>
                  <th>연락처</th>
                  <th>활동일</th>
                  <th>상태</th>
                  <th>인증사진</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="admin-nowrap">{formatDateTime(record.created_at)}</td>
                    <td>
                      <div className="admin-mission-cell">
                        <span>{String(record.mission_id).padStart(2, '0')}</span>
                        <strong>{missionMap[record.mission_id]?.title ?? `미션 ${record.mission_id}`}</strong>
                      </div>
                    </td>
                    <td><strong>{record.participant_name || '-'}</strong></td>
                    <td>
                      <span className={`admin-level-badge ${record.level ? '' : 'empty'}`}>
                        {record.level || '미입력'}
                      </span>
                    </td>
                    <td className="admin-nowrap">{record.phone || '-'}</td>
                    <td className="admin-nowrap">{record.activity_date || '-'}</td>
                    <td>
                      <select
                        className={`admin-status-select ${record.status === '확인' ? 'checked' : ''}`}
                        value={record.status === '확인' ? '확인' : '접수'}
                        onChange={(e) => updateStatus(record, e.target.value)}
                        disabled={updatingStatusId === record.id}
                      >
                        <option value="접수">접수</option>
                        <option value="확인">확인</option>
                      </select>
                    </td>
                    <td>
                      {record.photoUrls.length ? (
                        <div className="admin-thumb-row">
                          {record.photoUrls.map((url, index) => (
                            <button
                              type="button"
                              className="admin-thumb-button"
                              key={`${record.id}-${index}`}
                              onClick={() => setPhotoViewer({ urls: record.photoUrls, index, name: record.participant_name, record })}
                              title={`인증사진 ${index + 1} 크게 보기`}
                            >
                              <img src={url} alt={`${record.participant_name} 인증사진 ${index + 1}`} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="admin-no-photo">없음</span>
                      )}
                    </td>
                    <td>
                      <button className="admin-detail-button" type="button" onClick={() => setDetailRecord(record)}>
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-pagination">
          <button className="ghost-button" disabled={page <= 1 || loading} onClick={() => setPage((prev) => Math.max(1, prev - 1))}><ChevronLeft size={17} /> 이전</button>
          <span>{page} / {totalPages} 페이지 · 총 {total}건</span>
          <button className="ghost-button" disabled={page >= totalPages || loading} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>다음 <ChevronRight size={17} /></button>
        </div>
      </main>

      {detailRecord && (
        <div className="admin-detail-modal" role="dialog" aria-modal="true" onClick={() => setDetailRecord(null)}>
          <div className="admin-detail-card" onClick={(event) => event.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setDetailRecord(null)} aria-label="상세 닫기"><X size={20} /></button>
            <div className="admin-detail-head">
              <div>
                <span className="admin-mission-badge">{String(detailRecord.mission_id).padStart(2, '0')}</span>
                <h2>{detailRecord.participant_name || '이름 없음'}</h2>
                <p>{missionMap[detailRecord.mission_id]?.title ?? `미션 ${detailRecord.mission_id}`}</p>
              </div>
              <span className={`admin-level-badge ${detailRecord.level ? '' : 'empty'}`}>{detailRecord.level || '레벨 미입력'}</span>
            </div>

            <div className="admin-detail-meta">
              <div><span>제출일시</span><strong>{formatDateTime(detailRecord.created_at)}</strong></div>
              <div><span>연락처</span><strong>{detailRecord.phone || '-'}</strong></div>
              <div><span>활동일</span><strong>{detailRecord.activity_date || '-'}</strong></div>
              <div>
                <span>상태</span>
                <select
                  className={`admin-status-select ${detailRecord.status === '확인' ? 'checked' : ''}`}
                  value={detailRecord.status === '확인' ? '확인' : '접수'}
                  onChange={(e) => updateStatus(detailRecord, e.target.value)}
                  disabled={updatingStatusId === detailRecord.id}
                >
                  <option value="접수">접수</option>
                  <option value="확인">확인</option>
                </select>
              </div>
            </div>

            <div className="admin-detail-answers">
              {[
                detailRecord.answer_1,
                detailRecord.answer_2,
                detailRecord.answer_3,
              ].map((answer, index) => (
                <div key={index}>
                  <span>{missionMap[detailRecord.mission_id]?.questions?.[index] ?? `질문 ${index + 1}`}</span>
                  <p>{answer || '-'}</p>
                </div>
              ))}
              {detailRecord.comment && (
                <div>
                  <span>인증 설명</span>
                  <p>{detailRecord.comment}</p>
                </div>
              )}
            </div>

            {detailRecord.photoUrls.length > 0 && (
              <div className="admin-detail-photos">
                <h3>인증사진</h3>
                <div className="admin-photo-grid">
                  {detailRecord.photoUrls.map((url, index) => (
                    <button key={`${detailRecord.id}-detail-${index}`} type="button" onClick={() => setPhotoViewer({ urls: detailRecord.photoUrls, index, name: detailRecord.participant_name, record: detailRecord })}>
                      <img src={url} alt={`${detailRecord.participant_name} 인증사진 ${index + 1}`} />
                      <span><Eye size={15} /> 크게 보기</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {photoViewer && (
        <div className="photo-modal" role="dialog" aria-modal="true" onClick={() => setPhotoViewer(null)}>
          <div className="photo-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setPhotoViewer(null)} aria-label="사진 닫기"><X size={20} /></button>
            <img src={photoViewer.urls[photoViewer.index]} alt={`${photoViewer.name} 인증사진`} />
            <div className="photo-modal-nav">
              <button className="ghost-button" disabled={photoViewer.index <= 0} onClick={() => setPhotoViewer((prev) => ({ ...prev, index: prev.index - 1 }))}><ChevronLeft size={17} /> 이전</button>
              <div className="photo-modal-center">
                <span>{photoViewer.index + 1} / {photoViewer.urls.length}</span>
                <button
                  className="primary-button photo-download-button"
                  type="button"
                  onClick={() => downloadPhoto(photoViewer.urls[photoViewer.index], photoViewer.record, photoViewer.index)}
                >
                  <Download size={16} /> 사진 저장
                </button>
              </div>
              <button className="ghost-button" disabled={photoViewer.index >= photoViewer.urls.length - 1} onClick={() => setPhotoViewer((prev) => ({ ...prev, index: prev.index + 1 }))}>다음 <ChevronRight size={17} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(value))
  } catch {
    return value
  }
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="시흥시청소년수련관">
        <img src="/logo.png" alt="시흥시청소년수련관" />
      </a>
      <a
        className="external-link"
        href="https://www.shyouth.or.kr/best/main/view"
        target="_blank"
        rel="noreferrer"
      >
        으뜸성장챌린지 홈페이지 바로가기 <ExternalLink size={16} />
      </a>
    </header>
  )
}

function Stepper({ step }) {
  return (
    <div className="stepper" aria-label="진행 단계">
      {[1, 2, 3].map((item) => (
        <div key={item} className={`step-dot-wrap ${step >= item ? 'active' : ''}`}>
          <span className="step-dot">{step > item ? <Check size={14} /> : item}</span>
          <small>{item === 1 ? '미션 선택' : item === 2 ? '참가자 정보' : '인증 작성'}</small>
        </div>
      ))}
    </div>
  )
}

function ErrorBox({ message }) {
  return <div className="error-box">{message}</div>
}

export default App
