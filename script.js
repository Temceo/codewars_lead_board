const form = document.querySelector('form');
const list = document.getElementById('user-input');
const resultsDropDown = document.getElementById('results-dropdown');
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
        console.log(`Too many requests.  Rate limited (${error.message})`);
        // showToast(`Too many requests.  Rate limited (${error.message})`);
        fetchedDetails.unprocessedNames.push({ name, message: error.message });
        continue;
      }

      if (error.status === 404) {
        fetchedDetails.invalidNames.push(name);
      } else {
        fetchedDetails.failedNames.push(name);
      }
      const failedNames = fetchedDetails.failedNames;
      if (failedNames.length > 0) {
        console.log(`Failed to fetch: ${failedNames.join(', ')}`);
        // showToast(`Failed to fetch: ${failedNames.join(', ')}`);
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
  const userNames = list.value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  list.value = '';

  // fetch users from codewars
  const { fetchedDetails } = await fetchUsers([...new Set(userNames)]);
  validUsers = fetchedDetails.fetchedUsers
    .map(normaliseUser)
    .sort((a, b) => a.overallScore > b.overallScore);

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

function renderUserDetails(users, fetchedDetails) {
  populateDropDown(getAllLanguages(users));
  showRankings(resultsDropDown.value);
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
