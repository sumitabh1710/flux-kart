const fetchContact = async (connection, columnName, columnValue) => {
  const [rows] = await connection.execute(
    `SELECT * FROM Contact WHERE ${columnName} = ?`,
    [columnValue]
  );
  return rows;
};

const createContact = async (
  connection,
  email,
  phoneNumber,
  linkedId,
  linkPrecedence
) => {
  const [result] = await connection.execute(
    `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [email, phoneNumber, linkedId, linkPrecedence]
  );
  return result.insertId;
};

const updateContact = async (connection, contactId, linkedId) => {
  await connection.execute(
    `UPDATE Contact SET linkedId = ?, linkPrecedence = 'secondary', updatedAt = NOW() WHERE id = ?`,
    [linkedId, contactId]
  );
};

const consolidateContact = async (connection, email, phoneNumber) => {
  let primaryContact = null;
  let secondaryContacts = [];
  let emails = [];
  let phoneNumbers = [];

  const existingContactsByEmail = await fetchContact(
    connection,
    "email",
    email
  );

  existingContactsByEmail.forEach((contact) => {
    if (contact.linkPrecedence === "primary") {
      primaryContact = contact;
    } else {
      secondaryContacts.push(contact);
    }
  });

  const existingContactsByPhone = await fetchContact(
    connection,
    "phoneNumber",
    phoneNumber
  );

  existingContactsByEmail.forEach(async (contact) => {
    if (contact.linkPrecedence === "primary") {
        await updateContact(connection, contact.id, primaryContact.id);
    } else {
      secondaryContacts.push(contact);
    }
  });

  if (!primaryContact) {
    const newContactId = await createContact(
      connection,
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
      const newContactId = await createContact(
        connection,
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

  for (const contact of secondaryContacts) {
    if (contact.linkedId !== primaryContact.id) {
      await updateContact(connection, contact.id, primaryContact.id);
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
