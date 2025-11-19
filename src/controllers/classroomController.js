import * as classroomService from '../service/classroom-service.js'

export const getClassrooms = async function (req, res, next) {
    try {
        const result = await classroomService.getClassrooms();
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export const postClassrooms = async function (req, res, next) {
    try {
        const { building, room_number, room_type } = req.body;
        const params = { building, room_number, room_type };
        const result = await classroomService.postClassrooms(params);

        res.status(201).json({message: "등록 완료", result })
    } catch (err) {
        next(err);
    }
}

export const putClassrooms = async function (req, res, next) {
    try {
        const { id } = req.params;
        const { building, room_number, room_type } = req.body;
        const params = { id, building, room_number, room_type };
        const result = await classroomService.putClassrooms(params);
        res.status(200).json({ message: "수정 완료", result });
    } catch (err) {
        next(err);
    }
}

export const deleteClassrooms = async function (req, res, next) {
    try {
        const { id } = req.params;
        const result = await classroomService.deleteClassrooms(id)
        res.status(200).json({ message: "삭제 완료", result });
    } catch (err) {
        next(err);
    }
}

export const getClassroomsReservations = async function (req, res, next) {
    try {
        const { id } = req.params;
        const { date } = req.query;
        const params = { id, date };
        const result = await classroomService.getClassroomsReservations(params);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export const postClassroomReservations = async function (req, res, next) {
    try {
        const { id } = req.params;
        const user_id = req.user.user_id;
        const { reserve_date, start_time, end_time } = req.body;
        const params = {id, user_id, reserve_date, start_time, end_time};
        const result = await classroomService.postClassroomReservations(params);
        res.status(201).json({ message: "예약 완료", result });
    } catch (err) {
        next(err);
    }
}

export const deleteClassroomReservation = async function (req, res, next) {
    try {
        const { id, reservation_id } = req.params;
        const params = { id, reservation_id };
        const result = await classroomService.deleteClassroomReservation(params);
        res.status(200).json({ message: "삭제 완료", result });
    } catch (err) {
        next(err);
    }
};

// 강의실 개방 투표 현황 조회
export const getClassroomPolls = async function (req, res, next) {
    try {
        const { date } = req.query;
        // const user_id = req.user.user_id
        const user_id = 2423001;
        const params = { date, user_id };
        const result = await classroomService.getClassroomPolls(params);
        res.status(200).json(result)
    } catch (err) {
        next(err);
    }
}

// 강의실 개방 투표 룰 생성
export const postClassroomPolls = async function (req, res, next) {
    try {
        const { grade_id, required_count } = req.body;
        const params = { grade_id, required_count }
        const result =await classroomService.postClassroomPolls(params)
        res.status(201).json({ message: "투표 생성 완료", result })
    } catch (err) {
        next(err)
    }
}

// 투표 규칙 목록 조회
export const getPollRules = async function (req, res, next) {
    try {
        const result = await classroomService.getPollRules();
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// 투표 규칙 수정
export const putPollRules = async function (req, res, next) {
    try {
        const { rule_id, required_count} = req.body;
        const params = { rule_id, required_count }
        const result = await classroomService.putPollRules(params);
        res.status(200).json({ message: "규칙 수정 완료", result});
    } catch (err) {
        next(err);
    }
}

// 투표 규칙 목록 삭제
export const deletePollRules = async function (req, res, next) {
    try {
        const { rule_id } = req.params;
        const result = await classroomService.deletePollRules(rule_id);
        res.status(200).json({message: "투표 삭제 완료", result});
    } catch (err) {
        next(err);
    }
}


// 강의실 개방 투표
export const postReservationPolls = async function (req, res, next) {
    try {
        const user_id = req.user.user_id;
        const { poll_id } = req.params;
        const { action } = req.body;
        const params = { user_id, poll_id, action };
        const result = await classroomService.postReservationPolls(params);
        res.status(200).json({ message: "투표 처리 완료", result });
    } catch (err) {
        next(err)
    }
};


