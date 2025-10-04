/**
 * The TimetableController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/TimetableService');
const timetablesAdminGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesAdminGET);
};

const timetablesEventsIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesEventsIdDELETE);
};

const timetablesEventsPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesEventsPOST);
};

const timetablesProfessorUserIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesProfessorUserIdGET);
};

const timetablesStudentUserIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesStudentUserIdGET);
};

const timetablesTypeDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesTypeDELETE);
};

const timetablesTypePOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesTypePOST);
};

const timetablesTypePUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.timetablesTypePUT);
};


module.exports = {
  timetablesAdminGET,
  timetablesEventsIdDELETE,
  timetablesEventsPOST,
  timetablesProfessorUserIdGET,
  timetablesStudentUserIdGET,
  timetablesTypeDELETE,
  timetablesTypePOST,
  timetablesTypePUT,
};
