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
  Trash2,
  AlertTriangle,
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
    proof: '본인 활동사진 1장',
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
    proof: '걸음 수가 확인되는 앱 화면 캡처 + 본인 활동사진 1장',
    minPhotos: 2,
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
    proof: '본인 활동사진 1장 + 수거한 쓰레기 사진 1장',
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
    proof: '텀블러·다회용기·장바구니 등 실천사진',
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
    proof: '발견한 장소에서 촬영한 활동사진',
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
    proof: '관찰한 장소에서 촬영한 활동사진',
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
    proof: '문제 상황 사진 + 본인 활동사진 1장',
    minPhotos: 2,
  },
]

const LEVELS = ['골드', '플래티넘', '마스터', '드림']

const INITIAL_FORM = {
  name: '',
  birthDate: '',
  level: '',
  checkCode: '',
  activityDate: new Date().toISOString().slice(0, 10),
  answers: ['', '', ''],
  explanation: '',
  consent: false,
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


async function sha256Text(raw) {
  const encoded = new TextEncoder().encode(raw)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function makeParticipantKey(name, birthDate, level) {
  const normalizedName = name.trim().replace(/\s+/g, ' ')
  return sha256Text(`${normalizedName}|${birthDate}|${level}`)
}

async function makeVerificationHash(name, birthDate, level, checkCode) {
  const normalizedName = name.trim().replace(/\s+/g, ' ')
  return sha256Text(`${normalizedName}|${birthDate}|${level}|${checkCode}`)
}

function App() {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return <AdminPage />
  if (path.startsWith('/check')) return <ParticipantPortal initialView="status" />
  if (path.startsWith('/submit')) return <ParticipantPortal initialView="missions" />
  return <LandingPage />
}

function ParticipantPortal({ initialView = 'missions' }) {
  const SESSION_KEY = 'euddeum-participant-session'

  const [identity, setIdentity] = useState({
    name: '',
    birthDate: '',
    level: '',
    password: '',
  })
  const [participant, setParticipant] = useState(null)
  const [view, setView] = useState(initialView)
  const [selectedMissionId, setSelectedMissionId] = useState(null)
  const [submissionForm, setSubmissionForm] = useState({
    activityDate: new Date().toISOString().slice(0, 10),
    answers: ['', '', ''],
    consent: false,
  })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loadingSession, setLoadingSession] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false)
  const [error, setError] = useState('')
  const [submittedMissionId, setSubmittedMissionId] = useState(null)

  const mission = useMemo(
    () => MISSIONS.find((item) => item.id === selectedMissionId) ?? null,
    [selectedMissionId],
  )

  const submissionsByMission = useMemo(() => {
    const map = new Map()
    submissions.forEach((row) => map.set(Number(row.mission_id), row))
    return map
  }, [submissions])

  const completedCount = submissionsByMission.size

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [photos])

  const fetchMySubmissions = async (session = participant) => {
    if (!session?.verificationHash) return []
    setLoadingStatus(true)
    try {
      const { data, error: lookupError } = await supabase.rpc('lookup_my_submissions', {
        p_hash: session.verificationHash,
      })
      if (lookupError) throw lookupError
      const rows = data ?? []
      setSubmissions(rows)
      return rows
    } catch (err) {
      console.error('제출현황 확인 오류:', err)
      setError('제출현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      return []
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (
          parsed?.name &&
          parsed?.birthDate &&
          parsed?.level &&
          parsed?.participantKey &&
          parsed?.verificationHash
        ) {
          setParticipant(parsed)
          fetchMySubmissions(parsed)
        }
      }
    } catch (err) {
      console.warn('참가자 세션 복원 오류:', err)
      sessionStorage.removeItem(SESSION_KEY)
    } finally {
      setLoadingSession(false)
    }
  }, [])

  const setIdentityField = (key, value) => {
    setIdentity((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const setAnswer = (index, value) => {
    setSubmissionForm((prev) => {
      const next = [...prev.answers]
      next[index] = value
      return { ...prev, answers: next }
    })
    setError('')
  }

  const loginParticipant = async (event) => {
    event.preventDefault()
    setError('')

    if (!identity.name.trim()) return setError('이름을 입력해주세요.')
    if (!identity.birthDate) return setError('생년월일을 입력해주세요.')
    if (!LEVELS.includes(identity.level)) return setError('참여 레벨을 선택해주세요.')
    if (!/^\d{6}$/.test(identity.password)) return setError('비밀번호를 숫자 6자리로 입력해주세요.')

    setLoadingStatus(true)
    try {
      const participantKey = await makeParticipantKey(
        identity.name,
        identity.birthDate,
        identity.level,
      )
      const verificationHash = await makeVerificationHash(
        identity.name,
        identity.birthDate,
        identity.level,
        identity.password,
      )

      const { data: accessState, error: accessError } = await supabase.rpc(
        'validate_participant_access',
        {
          p_participant_key: participantKey,
          p_hash: verificationHash,
        },
      )

      if (accessError) throw accessError

      if (accessState === 'invalid') {
        setError('기존 제출내역과 비밀번호가 일치하지 않습니다. 비밀번호를 다시 확인해주세요.')
        return
      }

      const session = {
        name: identity.name.trim(),
        birthDate: identity.birthDate,
        level: identity.level,
        participantKey,
        verificationHash,
      }

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setParticipant(session)

      const { data, error: lookupError } = await supabase.rpc('lookup_my_submissions', {
        p_hash: verificationHash,
      })
      if (lookupError) throw lookupError
      setSubmissions(data ?? [])
    } catch (err) {
      console.error('참가자 정보 확인 오류:', err)
      setError('정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoadingStatus(false)
    }
  }

  const logoutParticipant = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setParticipant(null)
    setIdentity({ name: '', birthDate: '', level: '', password: '' })
    setSubmissions([])
    setSelectedMissionId(null)
    setSubmissionForm({
      activityDate: new Date().toISOString().slice(0, 10),
      answers: ['', '', ''],
      consent: false,
    })
    setPhotos([])
    setSubmittedMissionId(null)
    setView(initialView)
    setError('')
  }

  const openMission = (missionId) => {
    if (submissionsByMission.has(missionId)) return
    setSelectedMissionId(missionId)
    setSubmissionForm({
      activityDate: new Date().toISOString().slice(0, 10),
      answers: ['', '', ''],
      consent: false,
    })
    setPhotos([])
    setSubmittedMissionId(null)
    setError('')
    setView('submit')
  }

  const backToMissions = async () => {
    setSelectedMissionId(null)
    setPhotos([])
    setError('')
    setSubmittedMissionId(null)
    await fetchMySubmissions()
    setView('missions')
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
    if (!submissionForm.activityDate) return '활동일을 선택해주세요.'
    if (submissionForm.answers.some((answer) => !answer.trim())) return '질문 3개에 모두 답해주세요.'
    if (photos.length > 3) return '인증사진은 최대 3장까지 업로드할 수 있어요.'

    if (photos.length < mission.minPhotos) {
      if (mission.id === 3) return '걸음 수가 확인되는 앱 화면 캡처와 본인 활동사진을 각각 1장씩 업로드해주세요.'
      if (mission.id === 4) return '본인 활동사진 1장과 수거한 쓰레기 사진 1장을 업로드해주세요.'
      if (mission.id === 8) return '문제 상황 사진 1장과 본인 활동사진 1장을 업로드해주세요.'
      return '참여자 본인의 얼굴이 포함된 활동사진을 최소 1장 업로드해주세요.'
    }

    if (!submissionForm.consent) return '개인정보 및 인증자료 제출 안내에 동의해주세요.'
    return ''
  }

  const handleSubmit = async () => {
    if (!participant || isSubmitting || isProcessingPhotos) return

    const validationError = validateSubmission()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // 관리자에게 비밀번호가 재설정된 경우, 오래 열린 화면에서 예전 비밀번호로
      // 새 제출이 생기지 않도록 제출 직전에 다시 확인합니다.
      const { data: accessState, error: accessError } = await supabase.rpc(
        'validate_participant_access',
        {
          p_participant_key: participant.participantKey,
          p_hash: participant.verificationHash,
        },
      )

      if (accessError) throw accessError
      if (accessState === 'invalid') {
        sessionStorage.removeItem(SESSION_KEY)
        setParticipant(null)
        setError('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요.')
        return
      }

      const { data: duplicate, error: duplicateCheckError } = await supabase.rpc(
        'check_duplicate_submission',
        {
          p_participant_key: participant.participantKey,
          p_mission_id: mission.id,
        },
      )

      if (duplicateCheckError) throw duplicateCheckError
      if (duplicate === true) {
        await fetchMySubmissions()
        setError('이미 제출한 미션입니다.')
        return
      }

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
        participant_name: participant.name,
        birth_date: participant.birthDate,
        level: participant.level,
        participant_key: participant.participantKey,
        verification_hash: participant.verificationHash,
        mission_id: mission.id,
        activity_date: submissionForm.activityDate,
        answer_1: submissionForm.answers[0].trim(),
        answer_2: submissionForm.answers[1].trim(),
        answer_3: submissionForm.answers[2].trim(),
        comment: null,
        photo_paths: JSON.stringify(uploadedPaths),
        status: '접수',
      })

      if (insertError) throw insertError

      setSubmittedMissionId(mission.id)
      await fetchMySubmissions()
      setPhotos([])
      setSubmissionForm({
        activityDate: new Date().toISOString().slice(0, 10),
        answers: ['', '', ''],
        consent: false,
      })
      setView('success')
    } catch (err) {
      console.error('추가미션 제출 오류:', err)
      const message = String(err?.message ?? '')
      if (message.includes('DUPLICATE_MISSION') || err?.code === '23505') {
        setError('이미 제출한 미션입니다. 같은 미션은 중복 제출할 수 없어요.')
      } else if (message.toLowerCase().includes('payload') || message.toLowerCase().includes('file size')) {
        setError('사진 용량이 너무 큽니다. 다른 사진으로 다시 시도해주세요.')
      } else {
        setError('제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingSession) {
    return (
      <div className="site-shell">
        <Header />
        <main className="participant-loading">
          <Loader2 className="spin" size={28} />
          <p>참가자 정보를 확인하고 있어요.</p>
        </main>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="site-shell">
        <Header />
        <main className="participant-login-page">
          <section className="participant-login-card">
            <p className="eyebrow"><ShieldCheck size={15} /> PARTICIPANT</p>
            <h1>{initialView === 'status' ? '내 제출현황 확인' : '추가미션 참여하기'}</h1>
            <p className="participant-login-desc">
              한 번 정보를 입력하면 이 화면을 사용하는 동안 다시 입력하지 않아도 돼요.
              브라우저를 닫거나 '내 정보 초기화'를 누르면 정보가 사라집니다.
            </p>

            <form onSubmit={loginParticipant} className="participant-login-form">
              <label className="field-label">
                <span className="field-title">이름 <em>*</em></span>
                <input
                  className="text-input"
                  value={identity.name}
                  onChange={(e) => setIdentityField('name', e.target.value)}
                  placeholder="이름을 입력해주세요"
                  autoComplete="name"
                />
              </label>

              <label className="field-label">
                <span className="field-title">생년월일 <em>*</em></span>
                <input
                  className="text-input"
                  type="date"
                  value={identity.birthDate}
                  onChange={(e) => setIdentityField('birthDate', e.target.value)}
                />
              </label>

              <label className="field-label">
                <span className="field-title">참여 레벨 <em>*</em></span>
                <select
                  className="text-input select-input"
                  value={identity.level}
                  onChange={(e) => setIdentityField('level', e.target.value)}
                >
                  <option value="">레벨을 선택해주세요</option>
                  {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>

              <label className="field-label">
                <span className="field-title">비밀번호 <em>*</em></span>
                <div className="check-code-input-wrap">
                  <KeyRound size={18} />
                  <input
                    className="text-input"
                    value={identity.password}
                    onChange={(e) => setIdentityField('password', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="숫자 6자리"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                  />
                </div>
                <small className="field-help field-help-important">
                  처음 참여하는 경우 사용할 숫자 6자리를 직접 정해 주세요.
                  이미 제출한 미션이 있다면 <strong>기존에 사용한 비밀번호</strong>를 입력해 주세요.
                </small>
              </label>

              {error && <ErrorBox message={error} />}

              <button className="primary-button participant-login-button" disabled={loadingStatus}>
                {loadingStatus
                  ? <><Loader2 size={18} className="spin" /> 확인 중...</>
                  : <><ArrowRight size={18} /> 시작하기</>}
              </button>
            </form>

            <a href="/" className="admin-back-link">처음 화면으로 돌아가기</a>
          </section>
        </main>
      </div>
    )
  }

  const participantHeader = (
    <section className="participant-bar">
      <div className="participant-bar-copy">
        <span>참가자</span>
        <strong>{participant.name}</strong>
        <small>{participant.birthDate} · {participant.level}</small>
      </div>
      <div className="participant-bar-actions">
        <button
          className={`participant-tab ${view === 'missions' || view === 'submit' || view === 'success' ? 'active' : ''}`}
          onClick={() => { setView('missions'); setSelectedMissionId(null); setError('') }}
        >
          <Play size={15} /> 미션
        </button>
        <button
          className={`participant-tab ${view === 'status' ? 'active' : ''}`}
          onClick={async () => { await fetchMySubmissions(); setView('status'); setError('') }}
        >
          <ClipboardCheck size={15} /> 제출현황
        </button>
        <button className="participant-reset-button" onClick={logoutParticipant}>
          <LogOut size={15} /> 내 정보 초기화
        </button>
      </div>
    </section>
  )

  const missionNotice = (
    <details className="score-notice participant-notice">
      <summary>
        <span className="notice-summary-text">
          <strong className="notice-open">🎯 추가미션 OPEN!</strong>
          <span className="notice-period">인증기간 <b>2026. 9. 18.(금) ~ 10. 19.(월)</b></span>
          <span className="score-lines">
            <span>미션 1개 완료 시 <b>+2점</b>,</span>
            <span>최대 5개 참여 시 <b>총 +10점</b></span>
          </span>
          <span>추가미션 점수는 <strong>플랫폼에 실시간 반영되지 않으며</strong>, 활동비 지급 시 기존 활동점수에 합산됩니다.</span>
        </span>
        <span className="notice-more">자세히 보기</span>
      </summary>

      <div className="notice-detail">
        <div className="notice-key-info">
          <div><span>📅 인증기간</span><strong>2026. 9. 18.(금) ~ 10. 19.(월)</strong></div>
          <div><span>⭐ 참여점수</span><strong>미션 1개 완료 시 +2점</strong></div>
          <div><span>🙌 최대 참여</span><strong>5개 미션 · 총 +10점</strong></div>
        </div>

        <p className="notice-subtitle">💡 추가점수는 이렇게 적용돼요!</p>
        <p>추가미션 점수는 <strong>활동비 지급을 위한 추가점수</strong>로, <strong>플랫폼에는 실시간 반영되지 않습니다.</strong></p>
        <p>으뜸성장보고회까지 모든 활동이 마무리된 후, <strong>활동비 지급 시 기존 활동점수에 합산하여 최종 점수를 산정</strong>합니다.</p>
        <p>단, <strong>1~2위 상위 활동비 순위 산정에는 추가미션 점수가 포함되지 않습니다.</strong></p>

        <div className="notice-contact-box">
          <div className="notice-contact-header">☎ 추가미션 참여 문의</div>
          <div className="notice-contact-org">시흥시청소년수련관 청소년활동사업팀</div>
          <a className="notice-contact-phone" href="tel:0313151890">031-315-1890 <span>(내선 1)</span></a>
        </div>
      </div>
    </details>
  )

  return (
    <div className="site-shell">
      <Header />
      <main className="participant-portal">
        {participantHeader}
        {missionNotice}

        {view === 'missions' && (
          <section className="participant-content-card">
            <div className="participant-section-heading">
              <div>
                <p className="eyebrow"><Sparkles size={15} /> MY MISSIONS</p>
                <h1>도전할 미션을 선택해주세요</h1>
                <p>제출한 미션은 다시 제출할 수 없으며, 현재 상태도 바로 확인할 수 있어요.</p>
              </div>
              <div className="participant-progress">
                <strong>{completedCount}</strong><span>/ 5</span>
                <small>참여 미션</small>
              </div>
            </div>

            <div className="portal-mission-grid">
              {MISSIONS.map((item) => {
                const submitted = submissionsByMission.get(item.id)
                const checked = submitted?.status === '확인'
                const maxReached = completedCount >= 5 && !submitted

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`portal-mission-card ${submitted ? 'submitted' : ''} ${maxReached ? 'disabled' : ''}`}
                    disabled={Boolean(submitted) || maxReached}
                    onClick={() => openMission(item.id)}
                  >
                    <div className="portal-mission-top">
                      <span className="mission-number">{String(item.id).padStart(2, '0')}</span>
                      {submitted ? (
                        <span className="mission-submit-badge"><Check size={14} /> 제출완료</span>
                      ) : maxReached ? (
                        <span className="mission-limit-badge">최대 5개 완료</span>
                      ) : (
                        <span className="mission-open-badge">도전하기</span>
                      )}
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>

                    {submitted && (
                      <div className={`mission-status-line ${checked ? 'checked' : 'waiting'}`}>
                        {checked ? <Check size={14} /> : <Loader2 size={14} />}
                        {checked ? '담당자 미션 확인' : '접수 완료 · 확인 대기'}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {view === 'status' && (
          <section className="participant-content-card">
            <div className="participant-section-heading">
              <div>
                <p className="eyebrow"><ClipboardCheck size={15} /> MY STATUS</p>
                <h1>내 미션 제출현황</h1>
                <p>제출 여부와 담당자 확인 상태를 한눈에 확인할 수 있어요.</p>
              </div>
              <button className="ghost-button" onClick={() => fetchMySubmissions()} disabled={loadingStatus}>
                <RefreshCw size={16} className={loadingStatus ? 'spin' : ''} /> 새로고침
              </button>
            </div>

            {loadingStatus ? (
              <div className="check-empty"><Loader2 className="spin" size={28} /><strong>제출현황을 확인하고 있어요.</strong></div>
            ) : submissions.length === 0 ? (
              <div className="check-empty">
                <ClipboardCheck size={28} />
                <strong>아직 제출한 미션이 없습니다.</strong>
                <p>미션 탭에서 첫 번째 도전을 시작해보세요.</p>
              </div>
            ) : (
              <div className="portal-status-list">
                {submissions.map((record) => {
                  const item = MISSIONS.find((missionItem) => missionItem.id === Number(record.mission_id))
                  const checked = record.status === '확인'
                  return (
                    <article className="portal-status-row" key={record.submission_id}>
                      <span className="check-mission-number">{String(record.mission_id).padStart(2, '0')}</span>
                      <div>
                        <strong>{item?.title ?? `미션 ${record.mission_id}`}</strong>
                        <small>활동일 {record.activity_date || '-'} · 제출일 {formatDateTime(record.created_at)}</small>
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

        {view === 'submit' && mission && (
          <section className="participant-content-card submit-content-card">
            <button className="participant-back-button" type="button" onClick={() => { setView('missions'); setError('') }}>
              <ArrowLeft size={16} /> 미션 목록으로
            </button>

            <div className="section-heading">
              <span>MISSION {String(mission.id).padStart(2, '0')}</span>
              <h2>{mission.title}</h2>
              <p>{mission.summary}</p>
            </div>

            <label className="field-label">
              <span className="field-title">활동일 <em>*</em></span>
              <input
                type="date"
                className="text-input"
                value={submissionForm.activityDate}
                onChange={(e) => setSubmissionForm((prev) => ({ ...prev, activityDate: e.target.value }))}
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
                    value={submissionForm.answers[index]}
                    onChange={(e) => setAnswer(index, e.target.value)}
                    placeholder="내용을 입력해주세요"
                  />
                </label>
              ))}
            </div>

            <div className="common-proof-notice">
              <div className="common-proof-title">
                <ImagePlus size={20} />
                <strong>공통 인증 안내</strong>
              </div>
              <p>모든 미션은 <b>참여자 본인의 얼굴이 포함된 활동사진 1장</b>을 기본으로 제출해 주세요.</p>
              <p>미션에 따라 걸음 수 캡처, 수거한 쓰레기 사진, 문제 상황 사진 등 <b>추가 인증자료를 함께 제출</b>해야 합니다.</p>
            </div>

            <div className="proof-box">
              <div><ImagePlus size={20} /></div>
              <p><strong>미션별 인증방법</strong><span>{mission.proof}</span></p>
            </div>

            <div className="upload-section">
              <div className="upload-head">
                <div>
                  <strong className="field-title upload-title">인증사진 <em>*</em></strong>
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

            <label className="consent-row">
              <input
                type="checkbox"
                checked={submissionForm.consent}
                onChange={(e) => setSubmissionForm((prev) => ({ ...prev, consent: e.target.checked }))}
              />
              <span>이름·생년월일·레벨 및 인증자료가 참여자 확인, 추가미션 심사 및 점수 반영을 위해 사용되는 것에 동의합니다. <em>*</em></span>
            </label>

            {error && <ErrorBox message={error} />}

            <div className="action-row split final-actions">
              <button className="ghost-button" onClick={() => { setView('missions'); setError('') }} disabled={isSubmitting}>
                <ArrowLeft size={18} /> 취소
              </button>
              <button className="primary-button submit-button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? <><Loader2 size={18} className="spin" /> 제출 중...</>
                  : <>추가미션 인증 제출하기 <ArrowRight size={18} /></>}
              </button>
            </div>
          </section>
        )}

        {view === 'success' && (
          <section className="participant-content-card portal-success-card">
            <div className="success-icon"><Check size={34} strokeWidth={2.3} /></div>
            <p className="eyebrow">MISSION COMPLETE</p>
            <h1>{MISSIONS.find((item) => item.id === submittedMissionId)?.title} 제출완료!</h1>
            <p>접수가 완료되었습니다. 담당자가 확인하면 제출현황에서 '미션 확인'으로 바뀝니다.</p>

            <div className="success-actions">
              <button className="primary-button success-button" onClick={backToMissions}>
                다른 미션 도전하기 <ArrowRight size={18} />
              </button>
              <button className="ghost-button success-link" onClick={async () => { await fetchMySubmissions(); setView('status') }}>
                제출현황 보기 <ClipboardCheck size={18} />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}


function LandingPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="landing-guide-page">
        <section className="landing-guide-hero">
          <p className="eyebrow"><Sparkles size={15} /> EXTRA MISSION</p>
          <h1>시흥시<br />으뜸성장챌린지<br />추가미션</h1>
          <p>
            일상 속 작은 도전을 직접 고르고 실천하며,
            나만의 성장경험을 한 걸음 더 확장해보세요.
          </p>
        </section>

        <section className="landing-summary-card">
          <div className="landing-summary-item">
            <span>📅 인증기간</span>
            <strong>2026. 9. 18.(금) ~ 10. 19.(월)</strong>
          </div>
          <div className="landing-summary-item">
            <span>⭐ 참여점수</span>
            <strong>미션 1개당 +2점 · 최대 5개, 총 +10점</strong>
          </div>
          <div className="landing-summary-item">
            <span>💡 점수 반영</span>
            <strong>플랫폼 미반영 · 활동비 지급 시 최종 점수에 합산</strong>
          </div>
          <p className="landing-summary-note">
            추가미션 점수는 <b>1~2위 상위 활동비 순위 산정에는 포함되지 않습니다.</b>
          </p>
        </section>

        <section className="landing-mission-section">
          <div className="landing-section-heading">
            <div>
              <span className="landing-section-kicker">MISSION GUIDE</span>
              <h2>어떤 미션이 있나요?</h2>
              <p>총 8개의 추가미션 중 원하는 미션을 골라 참여할 수 있어요.</p>
            </div>
          </div>

          <div className="landing-mission-grid">
            {MISSIONS.map((mission) => (
              <article className="landing-mission-card" key={mission.id}>
                <span className="landing-mission-number">{String(mission.id).padStart(2, '0')}</span>
                <div>
                  <strong>{mission.title}</strong>
                  <p>{mission.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-proof-guide">
          <div className="landing-proof-icon"><ImagePlus size={22} /></div>
          <div>
            <strong>공통 인증 안내</strong>
            <p>
              모든 미션은 <b>참여자 본인의 얼굴이 포함된 활동사진 1장</b>을 기본으로 제출해 주세요.
              미션에 따라 걸음 수 캡처, 수거한 쓰레기 사진, 문제 상황 사진 등 추가 인증자료가 필요합니다.
            </p>
          </div>
        </section>

        <section className="landing-start-section">
          <div>
            <span className="landing-section-kicker">READY?</span>
            <h2>이제 미션을 시작해볼까요?</h2>
            <p>
              이름·생년월일·레벨·숫자 6자리 비밀번호를 한 번 입력하면
              현재 브라우저 이용 중에는 다시 입력하지 않아도 됩니다.
            </p>
          </div>

          <div className="landing-start-actions single">
            <a className="landing-start-primary" href="/submit">
              <span><Play size={20} /></span>
              <div>
                <strong>미션 제출하기</strong>
                <small>내 정보 입력 후 미션을 선택하고, 제출현황까지 한 번에 확인할 수 있어요.</small>
              </div>
              <ArrowRight size={21} />
            </a>
          </div>
        </section>

        <section className="landing-contact">
          <span>☎ 추가미션 참여 문의</span>
          <strong>시흥시청소년수련관 청소년활동사업팀</strong>
          <a href="tel:0313151890">031-315-1890 (내선 1)</a>
        </section>
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
  const [resetTarget, setResetTarget] = useState(null)
  const [resetCode, setResetCode] = useState('')
  const [resettingCode, setResettingCode] = useState(false)
  const [issuedCode, setIssuedCode] = useState('')
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const [clearingData, setClearingData] = useState(false)

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
          생년월일: row.birth_date ?? '',
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

  const openResetCode = (record) => {
    setResetTarget(record)
    setResetCode('')
    setIssuedCode('')
    setError('')
  }

  const generateResetCode = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setResetCode(code)
    setIssuedCode('')
  }

  const resetParticipantCode = async () => {
    if (!resetTarget) return
    if (!/^\d{6}$/.test(resetCode)) {
      setError('새 비밀번호를 숫자 6자리로 입력해주세요.')
      return
    }
    if (!resetTarget.birth_date || !resetTarget.level || !resetTarget.participant_name) {
      setError('생년월일·레벨 정보가 없는 기존 제출건은 비밀번호를 재설정할 수 없습니다.')
      return
    }

    setResettingCode(true)
    setError('')

    try {
      const participantKey = resetTarget.participant_key || await makeParticipantKey(
        resetTarget.participant_name,
        resetTarget.birth_date,
        resetTarget.level,
      )
      const newVerificationHash = await makeVerificationHash(
        resetTarget.participant_name,
        resetTarget.birth_date,
        resetTarget.level,
        resetCode,
      )

      const { error: resetError } = await supabase
        .from('submissions')
        .update({
          participant_key: participantKey,
          verification_hash: newVerificationHash,
        })
        .eq('participant_key', participantKey)

      if (resetError) throw resetError

      setRecords((prev) => prev.map((item) =>
        item.participant_key === participantKey
          ? { ...item, participant_key: participantKey, verification_hash: newVerificationHash }
          : item
      ))
      setIssuedCode(resetCode)
    } catch (err) {
      console.error('비밀번호 재설정 오류:', err)
      setError('비밀번호를 재설정하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setResettingCode(false)
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

  const openClearModal = () => {
    setClearConfirmText('')
    setError('')
    setShowClearModal(true)
  }

  const clearSubmissionData = async () => {
    if (clearConfirmText.trim() !== '초기화') {
      setError('초기화를 진행하려면 확인란에 "초기화"를 입력해주세요.')
      return
    }

    setClearingData(true)
    setError('')

    try {
      const targetRows = await fetchAllForExport()
      const photoPaths = targetRows.flatMap((row) => parsePaths(row.photo_paths))

      for (let i = 0; i < photoPaths.length; i += 100) {
        const chunk = photoPaths.slice(i, i + 100)
        const { error: storageDeleteError } = await supabase.storage
          .from('mission-photos')
          .remove(chunk)

        if (storageDeleteError) throw storageDeleteError
      }

      let deleteQuery = supabase
        .from('submissions')
        .delete()
        .gte('created_at', '1900-01-01T00:00:00Z')

      if (missionFilter !== 'all') {
        deleteQuery = deleteQuery.eq('mission_id', Number(missionFilter))
      }

      const { error: deleteError } = await deleteQuery
      if (deleteError) throw deleteError

      setShowClearModal(false)
      setClearConfirmText('')
      setPage(1)
      setPhotoViewer(null)
      setDetailRecord(null)

      await fetchCounts()
      await fetchRecords()
    } catch (err) {
      console.error('제출자료 초기화 오류:', err)
      setError('제출자료를 초기화하지 못했습니다. 관리자 삭제 권한을 확인해주세요.')
    } finally {
      setClearingData(false)
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
            <button className="danger-button" onClick={openClearModal} disabled={loading || (counts.all ?? 0) === 0}>
              <Trash2 size={16} /> 제출내용 초기화
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
                  <th>생년월일</th>
                  <th>활동일</th>
                  <th>상태</th>
                  <th>인증사진</th>
                  <th>내용</th>
                  <th>비밀번호</th>
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
                    <td className="admin-nowrap">{record.birth_date || '-'}</td>
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
                    <td>
                      <button
                        className="admin-reset-button"
                        type="button"
                        onClick={() => openResetCode(record)}
                        disabled={!record.birth_date || !record.level}
                      >
                        <RefreshCw size={14} /> 재설정
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

      {showClearModal && (
        <div className="admin-detail-modal" role="dialog" aria-modal="true" onClick={() => !clearingData && setShowClearModal(false)}>
          <div className="admin-clear-card" onClick={(event) => event.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setShowClearModal(false)} aria-label="닫기" disabled={clearingData}>
              <X size={20} />
            </button>

            <div className="admin-clear-heading">
              <span className="admin-clear-icon"><AlertTriangle size={22} /></span>
              <div>
                <h2>제출내용 초기화</h2>
                <p>
                  {missionFilter === 'all'
                    ? `현재 저장된 전체 제출자료 ${counts.all ?? 0}건`
                    : `${missionMap[Number(missionFilter)]?.title ?? `미션 ${missionFilter}`} 제출자료 ${counts[Number(missionFilter)] ?? 0}건`}
                </p>
              </div>
            </div>

            <div className="admin-clear-warning">
              <strong>삭제 후에는 복구할 수 없습니다.</strong>
              <p>제출 답변과 인증사진이 함께 삭제됩니다. 관리자 계정, 미션 설정, Supabase 구조는 삭제되지 않습니다.</p>
              <p>필요한 실적은 먼저 엑셀로 내려받은 뒤 초기화해주세요.</p>
            </div>

            <label className="field-label">
              <span className="field-title">확인을 위해 아래에 <b>초기화</b>를 입력해주세요.</span>
              <input
                className="text-input"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                placeholder="초기화"
                autoComplete="off"
                disabled={clearingData}
              />
            </label>

            <div className="admin-clear-actions">
              <button className="ghost-button" type="button" onClick={() => setShowClearModal(false)} disabled={clearingData}>취소</button>
              <button
                className="danger-button danger-confirm-button"
                type="button"
                onClick={clearSubmissionData}
                disabled={clearingData || clearConfirmText.trim() !== '초기화'}
              >
                {clearingData ? <><Loader2 size={17} className="spin" /> 삭제 중...</> : <><Trash2 size={17} /> 정말 초기화하기</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="admin-detail-modal" role="dialog" aria-modal="true" onClick={() => setResetTarget(null)}>
          <div className="admin-reset-card" onClick={(event) => event.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setResetTarget(null)} aria-label="닫기"><X size={20} /></button>

            <div className="admin-reset-heading">
              <span className="admin-reset-icon"><KeyRound size={21} /></span>
              <div>
                <h2>비밀번호 재설정</h2>
                <p>{resetTarget.participant_name} · {resetTarget.birth_date || '생년월일 미입력'} · {resetTarget.level || '레벨 미입력'}</p>
              </div>
            </div>

            {issuedCode ? (
              <div className="issued-code-box">
                <span>새 비밀번호</span>
                <strong>{issuedCode}</strong>
                <p>새 비밀번호를 참가자에게 전달해 주세요. 창을 닫으면 다시 확인할 수 없습니다.</p>
              </div>
            ) : (
              <>
                <p className="admin-reset-guide">
                  이 참가자가 제출한 모든 미션의 비밀번호가 새 비밀번호로 변경됩니다. 기존 비밀번호는 더 이상 사용할 수 없습니다.
                </p>
                <div className="reset-code-row">
                  <input
                    className="text-input"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="새 비밀번호 6자리"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button className="ghost-button" type="button" onClick={generateResetCode}>자동 생성</button>
                </div>
                <button className="primary-button reset-confirm-button" type="button" onClick={resetParticipantCode} disabled={resettingCode}>
                  {resettingCode ? <><Loader2 size={17} className="spin" /> 변경 중...</> : <><RefreshCw size={17} /> 새 비밀번호로 변경</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
              <div><span>생년월일</span><strong>{detailRecord.birth_date || '-'}</strong></div>
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

            <div className="admin-detail-tools">
              <button className="admin-reset-button" type="button" onClick={() => openResetCode(detailRecord)}>
                <RefreshCw size={14} /> 비밀번호 재설정
              </button>
              <small>기존 비밀번호는 표시하지 않습니다. 필요할 때 새 비밀번호로 재설정할 수 있습니다.</small>
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
