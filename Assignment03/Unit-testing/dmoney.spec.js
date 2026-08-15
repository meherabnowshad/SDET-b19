const { expect } = require('chai');
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
const API_SECRET_KEY = 'ROADTOSDET';
const DEFAULT_OTP = '0000';

// Generate unique timestamp for this test run
const TIMESTAMP = Date.now();

// Store tokens and IDs
let adminToken = '';
let systemToken = '';
let agentToken = '';
let customer1Token = '';
let customer2Token = '';
let merchantToken = '';

let agentId = '';
let customer1Id = '';
let customer2Id = '';
let merchantId = '';

const generatePhone = (prefix = '0171') => {
  return prefix + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
};

const generateEmail = (type) => {
  return `dmoney${type}${TIMESTAMP}${Math.floor(Math.random() * 1000)}@gmail.com`;
};

// Generate all test data at top level so it's accessible in all describe blocks
const customer1Email = generateEmail('customer1');
const customer1Phone = generatePhone('0175');
const customer2Email = generateEmail('customer2');
const customer2Phone = generatePhone('0176');
const agentEmail = generateEmail('agent');
const agentPhone = generatePhone('0177');
const merchantEmail = generateEmail('merchant');
const merchantPhone = generatePhone('0178');

describe('dMoney Integration Testing Flow', () => {
  // ==================== ADMIN LOGIN ====================
  describe('1. Admin Login', () => {
    it('should login as admin and receive access token', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/login`,
        {
          email: 'admin@dmoney.com',
          password: '1234'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('token');
      adminToken = response.data.token;
      console.log('✓ Admin token:', adminToken.substring(0, 20) + '...');
    });
  });

  // ==================== CREATE USERS ====================
  describe('2. Create Users (2 Customers, 1 Agent, 1 Merchant)', () => {
    it('should create Customer 1', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/create`,
        {
          name: 'Customer One',
          email: customer1Email,
          password: '1234',
          phone_number: customer1Phone,
          nid: '9876543210',
          role: 'Customer'
        },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('user');
      expect(response.data.user).to.have.property('id');
      customer1Id = response.data.user.id;
      console.log('✓ Customer 1 created with ID:', customer1Id, 'Phone:', customer1Phone);
    });

    it('should activate Customer 1', async () => {
      const response = await axios.patch(
        `${BASE_URL}/user/update/${customer1Id}`,
        { status: 'active' },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      console.log('✓ Customer 1 activated');
    });

    it('should create Customer 2', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/create`,
        {
          name: 'Customer Two',
          email: customer2Email,
          password: '1234',
          phone_number: customer2Phone,
          nid: '9876543211',
          role: 'Customer'
        },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('user');
      expect(response.data.user).to.have.property('id');
      customer2Id = response.data.user.id;
      console.log('✓ Customer 2 created with ID:', customer2Id, 'Phone:', customer2Phone);
    });

    it('should activate Customer 2', async () => {
      const response = await axios.patch(
        `${BASE_URL}/user/update/${customer2Id}`,
        { status: 'active' },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      console.log('✓ Customer 2 activated');
    });

    it('should create Agent', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/create`,
        {
          name: 'Agent User',
          email: agentEmail,
          password: '1234',
          phone_number: agentPhone,
          nid: '9876543212',
          role: 'Agent'
        },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('user');
      expect(response.data.user).to.have.property('id');
      agentId = response.data.user.id;
      console.log('✓ Agent created with ID:', agentId, 'Phone:', agentPhone);
    });

    it('should activate Agent', async () => {
      const response = await axios.patch(
        `${BASE_URL}/user/update/${agentId}`,
        { status: 'active' },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      console.log('✓ Agent activated');
    });

    it('should create Merchant', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/create`,
        {
          name: 'Merchant User',
          email: merchantEmail,
          password: '1234',
          phone_number: merchantPhone,
          nid: '9876543213',
          role: 'Merchant'
        },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('user');
      expect(response.data.user).to.have.property('id');
      merchantId = response.data.user.id;
      console.log('✓ Merchant created with ID:', merchantId, 'Phone:', merchantPhone);
    });

    it('should activate Merchant', async () => {
      const response = await axios.patch(
        `${BASE_URL}/user/update/${merchantId}`,
        { status: 'active' },
        {
          headers: {
            'Authorization': `bearer ${adminToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      console.log('✓ Merchant activated');
    });
  });

  // ==================== SYSTEM LOGIN & DEPOSIT ====================
  describe('3. System Account Login and Deposit to Agent', () => {
    it('should login as system account', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/login?env=dev`,
        {
          email: 'system@dmoney.com',
          password: '1234'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('token');
      systemToken = response.data.token;
      console.log('✓ System token:', systemToken.substring(0, 20) + '...');
    });

    it('should deposit 5000 tk from SYSTEM to Agent account', async () => {
      const response = await axios.post(
        `${BASE_URL}/transaction/deposit`,
        {
          from_account: 'SYSTEM',
          to_account: agentPhone,
          amount: 5000
        },
        {
          headers: {
            'Authorization': `bearer ${systemToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('trnxId');
      expect(response.data).to.have.property('amount');
      // System deposits do not charge commission (commission is agent-specific)
      expect(response.data).to.not.have.property('commission');
      console.log('✓ System deposit of 5000 tk to Agent successful, Trx ID:', response.data.trnxId);
    });
  });

  // ==================== AGENT LOGIN & DEPOSIT ====================
  describe('4. Agent Login and Deposit to Customer with Commission', () => {
    it('should login as agent', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/login?env=dev`,
        {
          email: agentEmail,
          password: '1234'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      console.log('✓ Agent login successful');
    });

    it('should verify OTP for agent login', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/verify-otp?env=dev`,
        {
          identifier: agentEmail,
          otp: DEFAULT_OTP
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('token');
      agentToken = response.data.token;
      console.log('✓ Agent OTP verified');
    });

    it('should deposit 2000 tk from Agent to Customer 1 with commission assertion', async () => {
      const response = await axios.post(
        `${BASE_URL}/transaction/deposit`,
        {
          from_account: agentPhone,
          to_account: customer1Phone,
          amount: 2000
        },
        {
          headers: {
            'Authorization': `bearer ${agentToken}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('trnxId');
      expect(response.data).to.have.property('commission');
      console.log('✓ Agent deposit of 2000 tk to Customer 1 successful');
      console.log('  Trx ID:', response.data.trnxId, '| Commission:', response.data.commission);
    });
  });

  // ==================== CUSTOMER 1 LOGIN ====================
  describe('5. Customer 1 Login and Verification', () => {
    it('should login as customer 1', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/login?env=dev`,
        {
          email: customer1Email,
          password: '1234'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      console.log('✓ Customer 1 login successful');
    });

    it('should verify OTP for customer 1', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/verify-otp?env=dev`,
        {
          identifier: customer1Email,
          otp: DEFAULT_OTP
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('token');
      customer1Token = response.data.token;
      console.log('✓ Customer 1 OTP verified');
    });
  });

  // ==================== CUSTOMER 2 LOGIN ====================
  describe('6. Customer 2 Login and Verification', () => {
    it('should login as customer 2', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/login?env=dev`,
        {
          email: customer2Email,
          password: '1234'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      console.log('✓ Customer 2 login successful');
    });

    it('should verify OTP for customer 2', async () => {
      const response = await axios.post(
        `${BASE_URL}/user/verify-otp?env=dev`,
        {
          identifier: customer2Email,
          otp: DEFAULT_OTP
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('token');
      customer2Token = response.data.token;
      console.log('✓ Customer 2 OTP verified');
    });
  });

  // ==================== SEND MONEY - CUSTOMER TO CUSTOMER ====================
  describe('7. Customer 1 Sends Money to Customer 2 with Service Fee', () => {
    it('should send 1000 tk from Customer 1 to Customer 2 and assert service fee', async () => {
      const response = await axios.post(
        `${BASE_URL}/transaction/sendmoney`,
        {
          from_account: customer1Phone,
          to_account: customer2Phone,
          amount: 1000
        },
        {
          headers: {
            'Authorization': `bearer ${customer1Token}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('trnxId');
      expect(response.data).to.have.property('fee');
      
      const serviceFee = response.data.fee;
      console.log('✓ Customer 1 sent 1000 tk to Customer 2, Service Fee:', serviceFee);
      console.log('  Transaction ID:', response.data.trnxId);
    });
  });

  // ==================== WITHDRAWAL - CUSTOMER FROM AGENT ====================
  describe('8. Customer 2 Withdraws from Agent with Service Fee', () => {
    it('should withdraw 500 tk from Agent and assert service fee', async () => {
      const response = await axios.post(
        `${BASE_URL}/transaction/withdraw`,
        {
          from_account: customer2Phone,
          to_account: agentPhone,
          amount: 500
        },
        {
          headers: {
            'Authorization': `bearer ${customer2Token}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('trnxId');
      expect(response.data).to.have.property('fee');
      
      const serviceFee = response.data.fee;
      console.log('✓ Customer 2 withdrew 500 tk from Agent, Service Fee:', serviceFee);
      console.log('  Transaction ID:', response.data.trnxId);
    });
  });

  // ==================== PAYMENT - CUSTOMER TO MERCHANT ====================
  describe('9. Customer 1 Pays Merchant with Service Fee', () => {
    it('should pay 400 tk to Merchant and assert service fee deducted', async () => {
      const response = await axios.post(
        `${BASE_URL}/transaction/payment`,
        {
          from_account: customer1Phone,
          to_account: merchantPhone,
          amount: 400
        },
        {
          headers: {
            'Authorization': `bearer ${customer1Token}`,
            'X-AUTH-SECRET-KEY': API_SECRET_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('trnxId');
      expect(response.data).to.have.property('fee');
      
      const serviceFee = response.data.fee;
      console.log('✓ Customer 1 paid 400 tk to Merchant, Service Fee:', serviceFee);
      console.log('  Transaction ID:', response.data.trnxId);
    });
  });
});