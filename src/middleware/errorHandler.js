// 모든 라우터의 가장 마지막에 위치하여, next(error)로 전달된 모든 에러를 최종적으로 처리

export const centralErrorHandler = (err, req, res, next) => {
    console.log(err.stack);

    const status = err.status || 500;

    res.status(status).json({
        success: false,
        message: err.message || "서버 내부에서 예상치 못한 오류가 발생했습니다.",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};