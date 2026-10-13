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
