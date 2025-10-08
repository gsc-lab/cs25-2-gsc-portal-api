import axios from 'axios';

/**
 * 1. 기본 API 정보 확인
 * HTTP Method: Post
 * URL: https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/{appkey}/messages
 *
 * 2. Header 정보 확인
 * Content-Type: application/json;charset=UTF-8
 * X-Secret-Key: NHN Cloud 콘솔에서 발급받은 Secret Key 값
 *
 * 3. 요청 본문(Request Body)
 * senderKey: 발신 프로필 키 (NHN 콘솔에서 확인)
 * templateCode: 승인받은 템플릿의 코드
 * recipientList: 메시지를 받을 사람의 목록 (배열)
 *  - recipientNo: 받는 사람 전화번호
 *  - templateParameter: 템플릿의 변수 #{변수명}에 채워 넣을 내용
 */

export const sendAlimtalk = async (recipientNo, templateCode, templateParams) => {
    // const templateParams = {
    //     "GSC Portal": "공지사항 || 시간표",
    //     "title": "제목 ~~",
    //     "content_preview": "내용~~",
    //     "URL": "http://127.0.0.1:8000",
    // };
    const APP_KEY = process.env.APP_KEY;
    const SECRET_KEY = process.env.SECRET_KEY;
    const SENDER_KEY = process.env.SENDER_KEY;


    const requestBody = {
        senderKey: SENDER_KEY,
        templateCode: templateCode,
        recipientList: [{
            recipientNo: recipientNo,
            templateParameter: templateParams,
        },
        ],
    };

    try {
        const response = await axios.post(
            `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${APP_KEY}/messages`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-Secret-Key': SECRET_KEY
                }
            }
        );

        console.log('알림톡 발송 성공', response.data);
        return response.data;
    } catch (error) {
        console.log(error.response.data);
        throw new Error('알림톡 발송 실패')
    }
}