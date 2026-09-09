# 시흥시으뜸성장챌린지 추가미션 인증 사이트

React + Vite + Supabase로 만든 참가자용 추가미션 인증 웹앱입니다.

## 포함 기능
- 8개 미션 선택
- 이름 / 연락처 입력
- 미션별 질문 3개
- 활동일 입력
- 인증사진 최대 3장 업로드
- 미션 4: 사진 최소 2장
- 미션 8: 사진 없이 인증 설명으로 대체 가능
- Supabase Storage `mission-photos` 업로드
- Supabase `submissions` 테이블 저장
- 제출 중 중복 클릭 방지
- 모바일 반응형 / 한글 단어 중간 줄바꿈 방지
- 시흥시청소년수련관 로고 포함

## 1. Supabase 환경변수
프로젝트 루트에 `.env` 파일을 만들고 다음 두 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_KEY
```

`service_role` 또는 secret key는 절대 넣지 마세요.

Vercel에서는 Project Settings > Environment Variables에 같은 이름으로 등록하면 됩니다.

## 2. submissions 테이블 컬럼
이 사이트는 아래 컬럼을 사용합니다.

- `id` uuid
- `participant_name` text
- `phone` text
- `mission_id` int8 또는 int4
- `activity_date` date
- `answer_1` text
- `answer_2` text
- `answer_3` text
- `comment` text
- `photo_paths` text
- `status` text
- `created_at` timestamptz (기본값 `now()` 권장)

`photo_paths`에는 예를 들어 아래처럼 JSON 문자열이 저장됩니다.

```text
["mission-1/uuid-photo1.jpg","mission-1/uuid-photo2.jpg"]
```

## 3. 필요한 RLS 정책
참가자는 로그인 없이 제출만 가능하고 다른 제출건은 읽지 못하도록 `submissions`에 INSERT 정책만 둡니다.

```sql
create policy "Allow anonymous insert"
on public.submissions
for insert
to anon
with check (true);
```

참가자용 SELECT / UPDATE / DELETE 정책은 만들지 않는 구성을 전제로 합니다.

## 4. Storage 정책
`mission-photos` 버킷은 Private으로 두고 익명 INSERT만 허용합니다.

```sql
create policy "Allow anonymous uploads"
on storage.objects
for insert
to anon
with check (bucket_id = 'mission-photos');
```

참가자용 SELECT / UPDATE / DELETE 정책은 만들지 않는 구성을 전제로 합니다.

## 5. 로컬 실행
Node.js가 설치된 환경에서:

```bash
npm install
npm run dev
```

## 6. Vercel 배포
1. GitHub에 이 프로젝트를 업로드합니다.
2. Vercel에서 GitHub 저장소를 Import 합니다.
3. Framework Preset은 Vite로 자동 인식됩니다.
4. Environment Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록합니다.
5. Deploy를 누릅니다.

## 7. 운영 전 테스트
- 미션 1: 사진 1장 제출
- 미션 4: 사진 1장일 때 차단 / 2장일 때 성공 확인
- 미션 8: 사진 없이 인증 설명으로 제출 확인
- Supabase Table Editor에서 데이터 저장 확인
- Storage에서 사진 경로 확인

## 보안 메모
이 프로젝트는 브라우저에서 Supabase publishable key를 사용합니다. publishable key는 프론트엔드용 키이며, 실제 접근 권한은 RLS와 Storage Policy로 제한해야 합니다. secret/service_role key는 프론트엔드에 넣지 마세요.
