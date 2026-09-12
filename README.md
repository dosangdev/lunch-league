# 학교스포츠클럽 점심리그

단일 HTML 점심리그 운영 화면을 Next.js 15.5.8 + Tailwind CSS + Supabase(Postgres) + Prisma로 옮긴 프로젝트입니다. 순위표, 링크제 예선, 본선 토너먼트, 관리자 설정이 클라우드 DB에 저장됩니다.

## 1. Supabase 준비

1. [Supabase](https://supabase.com)에서 프로젝트를 만듭니다. 리전은 `Northeast Asia (Seoul)`을 권장합니다.
2. **Project Settings → Database → Connect**에서 연결 방식을 **Prisma**로 고릅니다.
3. 아래 두 값을 `.env`에 넣습니다.

| 변수 | 어디서 복사 | 용도 |
| --- | --- | --- |
| `DATABASE_URL` | Transaction pooler (포트 **6543**) | 앱 / Vercel 런타임 |
| `DIRECT_URL` | Session pooler (포트 **5432**) | `prisma migrate` |

비밀번호에 `@`, `#` 같은 문자가 있으면 URL 인코딩해야 합니다. (`@` → `%40`)

`.env` 예시:

```bash
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
ADMIN_PIN=899196
ADMIN_SESSION_TOKEN=change-this-to-a-long-random-string
```

## 2. 로컬 실행

Node.js 20 이상을 사용하세요. (기본이 18이면 `nvm use`)

```bash
cd ~/Desktop/coding/lunch-league
nvm use
npm install
npx prisma migrate deploy
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

처음 접속하면 기본 학년/종목 데이터가 자동으로 들어갑니다. 관리자 PIN 기본값: `899196`

로컬 SQLite에 있던 데이터가 있다면 관리자 화면에서 JSON으로 백업한 뒤, Supabase 연결 후 같은 화면에서 복원하면 됩니다.

## 3. Vercel 배포

1. GitHub에 이 저장소를 올립니다. `.env`는 커밋하지 마세요.
2. [Vercel](https://vercel.com)에서 Import 합니다.
3. Environment Variables에 로컬과 같은 값을 넣습니다.
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `ADMIN_PIN`
   - `ADMIN_SESSION_TOKEN` (배포용으로 긴 임의 문자열)
4. Deploy 합니다. 빌드 중 `prisma migrate deploy`가 테이블을 만듭니다.

배포 후 첫 접속에서 시드 데이터가 채워집니다.

## 구성

- `src/app` Next.js App Router, API
- `src/components` 리그 화면
- `src/lib` 순위 계산, DB 접근, 인증
- `prisma/schema.prisma` Postgres 스키마
- `prisma/migrations` Supabase에 적용할 마이그레이션
