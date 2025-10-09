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
            return res.status(400).json({ error: "id, building, room_number, room_type are required" });
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