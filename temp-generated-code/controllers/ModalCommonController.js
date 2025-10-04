/**
 * The ModalCommonController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/ModalCommonService');
const modalClassroomsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalClassroomsGET);
};

const modalDaysGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalDaysGET);
};

const modalProfessorsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalProfessorsGET);
};

const modalSectionsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalSectionsGET);
};

const modalTimeslotsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalTimeslotsGET);
};


module.exports = {
  modalClassroomsGET,
  modalDaysGET,
  modalProfessorsGET,
  modalSectionsGET,
  modalTimeslotsGET,
};
