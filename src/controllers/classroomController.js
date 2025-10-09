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
        if (!date) { return res.status(400).json({error: "date is required"} )};
        const result = await classroomService.getClassroomPools(date);
        res.status(200).json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err});
    }
}