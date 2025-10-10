import * as classroomService from '../service/classroom-service.js'

export const getClassrooms = async function (req, res) {
    try {
        const result = await classroomService.getClassrooms();
        res.status(200).json(result);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error :err })
    }
}

export const postClassrooms = async function (req, res) {
    try {
        const { building, room_number, room_type } = req.body;
        if (!building || !room_number || !room_type) {
            res.status(400).json({ error: "building, room_number, room_type are required" });
        }
        const result = await classroomService.postClassrooms(building, room_number, room_type);
        res.status(200).json({message: "등록 완료" })
    } catch (err) {
        res.status(500).json({ error: err});
    }
}

export const putClassrooms = async function (req, res) {
    try {
        const { id } = req.params;
        const { building, room_number, room_type } = req.body;

        if (!id || !building || !room_number || !room_type) {
            return res.status(400).json({ error: "id, building, room_number, room_type are required"} );
        }

        const result = await classroomService.putClassrooms(id, building, room_number, room_type);
        res.status(200).json({ message: "수정 완료" });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err});
    }
}

export const deleteClassrooms = async function (req, res) {
    try {
        const { id } = req.params;
        if(!id) { res.status(400).json({error: "id is required"} )};
        const reulst = await classroomService.deleteClassrooms(id)
        res.status(200).json({ message: "삭제 완료" });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err})
    }
}

export const getClassroomsReservations = async function (req, res) {
    try {
        const { id } = req.params;
        const { date } = req.query;
        if (!id || !date) {
            return res.status(400).json({ error: "id and date are required"} );
        }
        const result = await classroomService.getClassroomsReservations(id, date);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err});
    }
}

export const postClassroomReservations = async function (req, res) {
    try {
        const { id } = req.params;
        const user_id = req.user.user_id;
        const { reserve_date, start_time, end_time } = req.body;
        if (!id || !user_id || !reserve_date || !start_time || !end_time) {
            return res.status(400).json({ error: "id, user_id, reservation_date, start_time, end_time are required" });
        }
        const result = await classroomService.postClassroomReservations(id, user_id, reserve_date, start_time, end_time);
        res.status(200).json({ message: "예약 완료", result });
    } catch (err) {
        console.error(err)
        res.status(500).json({error: err});
    }
}

export const deleteClassroomReservation = async function (req, res) {
    try {
        const { id, reservation_id } = req.params;
        if (!id || !reservation_id) {
            return res.status(400).json({ error: "id, reservation_id are required" });
        }
        const result = await classroomService.deleteClassroomReservation(id, reservation_id);
        res.status(200).json({ message: "삭제 완료", result });
    } catch (err) {
        console.error("deleteClassroomReservation Error:", err);
        res.status(500).json({ error: err.message || err });
    }
};

// 강의실 개방 투표 현황 조회
export const getClassroomPolls = async function (req, res) {
    try {
        const { date } = req.query;
        const user_id = req.user.user_id
        if (!date || !user_id) { return res.status(400).json({error: "date and user_id are required"} )};
        const result = await classroomService.getClassroomPolls(date, user_id);
        res.status(200).json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

// 강의실 개방 투표 생성
export const postClassroomPolls = async function (req, res) {
    try {
        const { grade_id, classroom_id, poll_date, target_weekend, required_count } = req.body;
        if (!grade_id || !classroom_id || !poll_date || !target_weekend || !required_count) {
            return res.status(400).json({ error: "grade_id, classroom_id, poll_date, target_weekend, required_count are required" });
        }
        const result =await classroomService.postClassroomPolls(grade_id, classroom_id, poll_date, target_weekend, required_count)
        res.status(200).json({ message: "투표 생성 완료", result })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message })
    }

}

// 강의실 개방 투표
export const postReservationPolls = async function (req, res) {
    try {
        const user_id = req.user.user_id;
        const { poll_id } = req.params;
        const { action } = req.body;

        if (!user_id || !poll_id || !action) {
        return res.status(400).json({ error: "user_id, poll_id, action are required" });
        }

        let result;

        if (action === "apply") {
        result = await classroomService.addVote(user_id, poll_id);
        return res.status(200).json({ message: "투표 신청 완료", result });
        } 
        else if (action === "cancel") {
        result = await classroomService.removeVote(user_id, poll_id);
        return res.status(200).json({ message: "투표 취소 완료", result });
        } 
        else {
        return res.status(400).json({ error: "Invalid action type. Use 'apply' or 'cancel'." });
        }
    } catch (err) {
        console.error(err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message });
    }
};


