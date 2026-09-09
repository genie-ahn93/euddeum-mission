import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  ImagePlus,
  Info,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
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

const INITIAL_FORM = {
  name: '',
  phone: '',
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

function App() {
  const [step, setStep] = useState(1)
  const [selectedMissionId, setSelectedMissionId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setError('')
    setStep(3)
  }

  const handleFiles = (event) => {
    const incoming = Array.from(event.target.files ?? [])
    if (!incoming.length) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    for (const file of incoming) {
      if (!allowed.includes(file.type)) {
        setError('JPG, JPEG, PNG, WEBP 이미지 파일만 업로드할 수 있어요.')
        event.target.value = ''
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('사진은 한 장당 최대 10MB까지 업로드할 수 있어요.')
        event.target.value = ''
        return
      }
    }

    setPhotos((prev) => [...prev, ...incoming].slice(0, 3))
    setError('')
    event.target.value = ''
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
    if (isSubmitting) return
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

      const { error: insertError } = await supabase.from('submissions').insert({
        participant_name: form.name.trim(),
        phone: form.phone,
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
            <button className="primary-button success-button" onClick={resetAll}>
              다른 미션 도전하기 <ArrowRight size={18} />
            </button>
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
              <span className="desktop-title">시흥시으뜸성장챌린지<br />추가미션</span>
              <span className="mobile-title">시흥시<br />으뜸성장챌린지<br />추가미션</span>
            </h1>
            <div className="score-notice">
              <Info size={18} />
              <p>
                추가점수는 기본 활동비 수여 기준 충족 점수에는 포함되나,
                <strong> 1~2위 상위 활동비 순위 산정에는 반영되지 않습니다.</strong>
              </p>
            </div>
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
                이름 <em>*</em>
                <input
                  className="text-input"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="이름을 입력해주세요"
                  autoComplete="name"
                />
              </label>

              <label className="field-label">
                연락처 <em>*</em>
                <input
                  className="text-input"
                  value={form.phone}
                  onChange={(e) => setField('phone', formatPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  autoComplete="tel"
                />
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
                활동일 <em>*</em>
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
                    <span className="question-number">Q{index + 1}</span> {question} <em>*</em>
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
                    <strong>인증사진 {mission.id === 8 ? '' : '*'}</strong>
                    <span>JPG · JPEG · PNG · WEBP / 장당 최대 10MB / 최대 3장</span>
                  </div>
                  <span>{photos.length}/3</span>
                </div>

                <label className={`upload-drop ${photos.length >= 3 ? 'disabled' : ''}`}>
                  <Upload size={24} />
                  <strong>사진 선택하기</strong>
                  <span>휴대폰 사진 또는 캡처 이미지를 선택해주세요.</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFiles}
                    disabled={photos.length >= 3}
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
                  인증 설명 <em>*</em>
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
