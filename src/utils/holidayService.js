import axios from "axios";

const SERVICE_KEY = (process.env.KOREA_HOLIDAY_KEY || "").trim();

function parseDate(dateString) {
    const year = dateString.slice(0, 4);
    const month = dateString.slice(5, 7);
    const day = dateString.slice(8, 10);
    return { year, month, day };
}

function getDayCode(dateString) {
    const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const idx = new Date(dateString).getDay();
    return map[idx]; // 예: "MON"
}

export async function getNationalHoliday(dateString) {
    const { year, month, day } = parseDate(dateString);
    const dayCode = getDayCode(dateString);   // 요일 코드 계산

    const baseUrl =
        "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

    const query =
        "?" +
        encodeURIComponent("serviceKey") +
        "=" +
        SERVICE_KEY +
        "&" +
        encodeURIComponent("solYear") +
        "=" +
        encodeURIComponent(year) +
        "&" +
        encodeURIComponent("solMonth") +
        "=" +
        encodeURIComponent(month) +
        "&" +
        encodeURIComponent("_type") +
        "=" +
        encodeURIComponent("json") +
        "&" +
        encodeURIComponent("numOfRows") +
        "=" +
        encodeURIComponent("50");

    const fullUrl = baseUrl + query;
    console.log("[HOLIDAY] fullUrl:", fullUrl);

    try {
        const res = await axios.get(fullUrl);
        const data = res.data;
        // console.log("[HOLIDAY] data:", JSON.stringify(data, null, 2));

        // item이 1개일 때는 object, 여러 개일 때는 array라서 통일 필요
        let items = data?.response?.body?.items?.item ?? [];
        if (!Array.isArray(items)) {
        items = [items];
        }

        const locdateNumber = Number(`${year}${month}${day}`); // 20250505
        const found = items.find((item) => item.locdate === locdateNumber);

        if (!found) {
        return { isHoliday: false, name: null, dayCode };
        }

        return {
        isHoliday: true,
        name: found.dateName, // 예: "어린이날"
        dayCode,              // 예: "MON"
        };
    } catch (err) {
        return { isHoliday: false, name: null, dayCode };
    }
}







// src/utils/dayCode.js
export function toDayCode(dateString) {
    const d = new Date(dateString + "T00:00:00");
    const jsDay = d.getDay(); // 0:일 ~ 6:토
    const map = {
        1: "MON",
        2: "TUE",
        3: "WED",
        4: "THU",
        5: "FRI",
    };
    return map[jsDay] || null; // 토/일이면 null
}
