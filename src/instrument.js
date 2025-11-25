// src/instrument.js
import * as Sentry from "@sentry/node";

Sentry.init({
    // DSN은 그대로 유지
    dsn: "https://dd83927e035ed619736b07e03588e2fc@o4510423020470272.ingest.us.sentry.io/4510423029645312",
    
    // [수정된 부분] v8 문법: 함수 형태로 사용해야 합니다.
    integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
    ],

    // 트레이싱 샘플링 비율 (1.0 = 100% 기록)
    tracesSampleRate: 1.0,
});