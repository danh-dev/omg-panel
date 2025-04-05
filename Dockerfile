FROM oven/bun:latest as base

# Cài đặt dependencies
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN bun install

# Build ứng dụng
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Không cần thiết lập giá trị, chỉ khai báo các biến
ARG GOOGLE_SHEET_ID
ARG GOOGLE_SERVICE_ACCOUNT_EMAIL
ARG GOOGLE_PRIVATE_KEY
ENV GOOGLE_SHEET_ID=$GOOGLE_SHEET_ID
ENV GOOGLE_SERVICE_ACCOUNT_EMAIL=$GOOGLE_SERVICE_ACCOUNT_EMAIL
ENV GOOGLE_PRIVATE_KEY=$GOOGLE_PRIVATE_KEY

RUN bun run build

# Stage sản phẩm
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Chỉ khai báo các biến môi trường mà không gán giá trị
# Các giá trị sẽ được cung cấp thông qua env_file trong docker-compose
ENV GOOGLE_SHEET_ID=""
ENV GOOGLE_SERVICE_ACCOUNT_EMAIL=""
ENV GOOGLE_PRIVATE_KEY=""

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Sử dụng Node.js để chạy ứng dụng
CMD ["node", "server.js"]