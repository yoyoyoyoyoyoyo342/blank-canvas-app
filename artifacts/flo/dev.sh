#!/bin/sh
export PORT=5173
export BASE_PATH=/
exec pnpm --filter @workspace/flo run dev
