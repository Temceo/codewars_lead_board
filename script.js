const form = document.querySelector('form');
const list = document.getElementById('user-input');
const resultsDropDown = document.getElementById('results-dropdown');
const resultsMessage = document.getElementById('results-message');
const inputError = document.getElementById('input-error');
const tableBody = document.querySelector('.leader-board tbody');

let validUsers = [];

async function fetchUser(userName) {
  const response = await fetch(
    `https://www.codewars.com/api/v1/users/${encodeURIComponent(userName)}`
  );

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function fetchUsers(userNames) {
  const fetchedDetails = {
    fetchedUsers: [],
    invalidNames: [], // invalid codewars usernames
    failedNames: [], // CORS, network, json errors etc
    unprocessedNames: [], // not processed due to too many requests
  };

  for (const name of userNames) {
    try {
      fetchedDetails.fetchedUsers.push(await fetchUser(name));
    } catch (error) {
      if (error.status === 429) {
        fetchedDetails.unprocessedNames.push({ name, message: error.message });
        continue;
      }

      if (error.status === 404) {
        fetchedDetails.invalidNames.push(name);
      } else {
        fetchedDetails.failedNames.push(name);
      }
    }
  }
  return { fetchedDetails };
}

function normaliseUser(user) {
  const languages = Object.entries(user.ranks?.languages ?? {}).map(
    ([language, info]) => ({ language, score: info?.score ?? 0 })
  );

  return {
    username: user.username,
    clan: user.clan ?? null,
    overallScore: user.ranks?.overall?.score ?? 0,
    languages,
  };
}

async function handleSubmit(e) {
  e.preventDefault();
  resultsMessage.textContent = '';
  inputError.textContent = '';
  if (list.value === '') {
    tableBody.replaceChildren();
    inputError.textContent =
      'No input entered.  Please add usernames before submitting.';
    return;
  }
  const userNames = list.value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  list.value = '';

  // fetch users from codewars
  const { fetchedDetails } = await fetchUsers([...new Set(userNames)]);
  validUsers = fetchedDetails.fetchedUsers
    .map(normaliseUser)
    .sort((a, b) => b.overallScore - a.overallScore);

  console.log(validUsers);
  // render valid users on page
  renderUserDetails(validUsers, fetchedDetails);
}

function getAllLanguages(users) {
  const uniqueLanguages = new Set();
  for (const user of users) {
    for (const entry of user.languages) {
      uniqueLanguages.add(entry.language);
    }
  }

  return [...uniqueLanguages].sort();
}

function renderResultsMessage(users, fetchedDetails) {
  const { invalidNames, unprocessedNames, failedNames } = fetchedDetails;
  let messages = [];
  // results.hidden = false;

  if (users.length === 0) {
    messages.push('No users found.');
    results.hidden = true;
  } else if (users.length === 1) {
    messages.push('1 user found.');
  } else {
    messages.push(`${users.length} users found.`);
  }
  if (invalidNames.length === 1) {
    messages.push(`${invalidNames[0]} is an invalid username`);
  } else if (invalidNames.length > 1) {
    const last = invalidNames.at(-1);
    const allButLast = invalidNames.slice(0, -1).join(', ');
    messages.push(`${allButLast} and ${last} are invalid usernames`);
  }

  if (unprocessedNames.length > 0) {
    messages.push(
      `Could not process due to too many calls: ${fetchedDetails.unprocessedNames.map(({ name, error }) => `${name}: ${error}`).join(', ')}`
    );
  }

  if (failedNames.length > 0) {
    messages.push(
      `Failed to fetch these names: ${fetchedDetails.failedNames.join(', ')}`
    );
  }

  resultsMessage.textContent = messages.join('\n');
}

function renderUserDetails(users, fetchedDetails) {
  populateDropDown(getAllLanguages(users));
  showRankings(resultsDropDown.value);
  renderResultsMessage(users, fetchedDetails);
}

function createOption(language) {
  const option = document.createElement('option');
  option.value = language;
  option.textContent = language;
  return option;
}

function populateDropDown(languages) {
  resultsDropDown.replaceChildren(createOption('overall'));
  for (const language of languages) {
    resultsDropDown.append(createOption(language));
  }
}

function populateTable(rows) {
  tableBody.replaceChildren();
  for (const values of rows) {
    const row = document.createElement('tr');

    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    tableBody.append(row);
  }
}

function showRankings(option) {
  const rows = [];
  for (const user of validUsers) {
    if (option === 'overall') {
      rows.push([user.username, user.clan ?? '-', user.overallScore]);
      continue;
    }

    const match = user.languages.find((entry) => entry.language === option);

    if (match) {
      rows.push([user.username, user.clan ?? '-', match.score]);
    }
  }

  if (!option === 'overall') {
    rows.sort((a, b) => a[2] > b[2]);
  }

  populateTable(rows);
}

form.addEventListener('submit', handleSubmit);
resultsDropDown.addEventListener('change', () => {
  showRankings(resultsDropDown.value);
});

list.addEventListener('input', () => {
  resultsMessage.textContent = '';
  tableBody.replaceChildren();
  // results.hidden = true;
});
