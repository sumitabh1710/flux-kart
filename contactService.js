const { pool } = require("./db");

const fetchContact = async (columnName, columnValue) => {
  const query = {
    text: `SELECT * FROM Contact WHERE ${columnName} = $1`,
    values: [columnValue],
  };

  const { rows } = await pool.query(query);
  return rows;
};

const fetchContactByEmailAndPhone = async (email, phoneNumber) => {
  const query = {
    text: "SELECT * FROM Contact WHERE email = $1 AND phoneNumber = $2",
    values: [email, phoneNumber],
  };

  const { rows } = await pool.query(query);
  return rows;
};

const createContact = async (email, phoneNumber, linkedId, linkPrecedence) => {
  const query = {
    text: `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence, createdAt, updatedAt) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
    values: [email, phoneNumber, linkedId, linkPrecedence],
  };

  const { rows } = await pool.query(query);
  return rows[0].id;
};

const updateContact = async (contactId, linkedId) => {
  const query = {
    text: `UPDATE Contact SET linkedId = $1, linkPrecedence = 'secondary', updatedAt = NOW() WHERE id = $2`,
    values: [linkedId, contactId],
  };

  await pool.query(query);
};

const consolidateContact = async (email, phoneNumber) => {
  let primaryContact = null;
  let primaryContact2 = null;
  let secondaryContacts = [];
  let emails = [];
  let phoneNumbers = [];

  const existingContactByEmailAndPhone = await fetchContactByEmailAndPhone(
    email,
    phoneNumber
  );

  if (existingContactByEmailAndPhone.length > 0) {
    await pool.query(
      `UPDATE Contact SET updated_at = NOW() WHERE email = $1 AND phoneNumber = $2`,
      [email, phoneNumber]
    );

    return { message: "Already Exists !" };
  }

  const existingContactsByEmail = await fetchContact("email", email);

  existingContactsByEmail.forEach((contact) => {
    if (contact.linkPrecedence === "primary") {
      primaryContact = contact;
    } else {
      secondaryContacts.push(contact);
    }
  });

  const existingContactsByPhone = await fetchContact(
    "phoneNumber",
    phoneNumber
  );

  existingContactsByPhone.forEach(async (contact) => {
    if (contact.linkPrecedence === "primary") {
      if (primaryContact) {
        primaryContact2 = contact;
      } else {
        primaryContact = contact;
      }
    } else {
      secondaryContacts.push(contact);
    }
  });

  if (!primaryContact) {
    const newContactId = await createContact(
      email,
      phoneNumber,
      null,
      "primary"
    );
    primaryContact = {
      id: newContactId,
      email,
      phoneNumber,
      linkedId: null,
      linkPrecedence: "primary",
    };
  } else {
    if (
      email !== primaryContact.email ||
      phoneNumber !== primaryContact.phoneNumber
    ) {
      if (primaryContact2) {
        await updateContact(primaryContact2.id, primaryContact.id);
      } else {
        const newContactId = await createContact(
          email,
          phoneNumber,
          primaryContact.id,
          "secondary"
        );
        secondaryContacts.push({
          id: newContactId,
          email,
          phoneNumber,
          linkedId: primaryContact.id,
          linkPrecedence: "secondary",
        });
      }
    }
  }

  for (const contact of secondaryContacts) {
    if (contact.linkedId !== primaryContact.id) {
      await updateContact(contact.id, primaryContact.id);
    }
  }

  emails.push(primaryContact.email);
  phoneNumbers.push(primaryContact.phoneNumber);
  secondaryContacts.forEach((contact) => {
    if (!emails.includes(contact.email)) {
      emails.push(contact.email);
    }
    if (!phoneNumbers.includes(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
    }
  });

  return {
    primaryContatctId: primaryContact.id,
    emails,
    phoneNumbers,
    secondaryContactIds: secondaryContacts.map((contact) => contact.id),
  };
};

module.exports = { consolidateContact };
