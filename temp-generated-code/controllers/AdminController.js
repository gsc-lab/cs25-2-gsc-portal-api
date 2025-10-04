/**
 * The AdminController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/AdminService');
const adminEmailGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminEmailGET);
};

const adminEmailIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminEmailIdDELETE);
};

const adminEmailPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminEmailPOST);
};

const adminStudentsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminStudentsGET);
};

const adminStudentsIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminStudentsIdDELETE);
};

const adminStudentsUserIdPATCH = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminStudentsUserIdPATCH);
};

const adminUsersGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminUsersGET);
};

const adminUsersIdDELETE = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminUsersIdDELETE);
};

const adminUsersPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.adminUsersPOST);
};


module.exports = {
  adminEmailGET,
  adminEmailIdDELETE,
  adminEmailPOST,
  adminStudentsGET,
  adminStudentsIdDELETE,
  adminStudentsUserIdPATCH,
  adminUsersGET,
  adminUsersIdDELETE,
  adminUsersPOST,
};
