-- 이미 동일한 정책이 있다면 중복 실행하지 마세요.

-- 참가자는 submissions에 새 행만 추가 가능
create policy "Allow anonymous insert"
on public.submissions
for insert
to anon
with check (true);

-- 참가자는 private bucket인 mission-photos에 업로드만 가능
create policy "Allow anonymous uploads"
on storage.objects
for insert
to anon
with check (bucket_id = 'mission-photos');
