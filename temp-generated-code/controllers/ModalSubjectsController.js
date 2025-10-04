/**
 * The ModalSubjectsController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/ModalSubjectsService');
const modalClassesLevelIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalClassesLevelIdGET);
};

const modalCoursesAllGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalCoursesAllGET);
};

const modalCoursesKoreanGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalCoursesKoreanGET);
};

const modalCoursesRegularGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalCoursesRegularGET);
};

const modalCoursesSpecialGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalCoursesSpecialGET);
};

const modalLevelsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalLevelsGET);
};

const modalLevelsKoreanGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.modalLevelsKoreanGET);
};


module.exports = {
  modalClassesLevelIdGET,
  modalCoursesAllGET,
  modalCoursesKoreanGET,
  modalCoursesRegularGET,
  modalCoursesSpecialGET,
  modalLevelsGET,
  modalLevelsKoreanGET,
};
