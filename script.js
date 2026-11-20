const form = document.querySelector('form');
const list = document.getElementById('user-input');

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

async function handleSubmit(e) {
  e.preventDefault();
  const userNames = list.value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  list.value = '';

  // fetch users from codewars
  const { fetchedDetails } = await fetchUsers([...new Set(userNames)]);
  console.log(fetchedDetails);

  // render valid users on page
}

form.addEventListener('submit', handleSubmit);

// const obj = {
//   id: '5f377b0153f391002e81ee26',
//   username: 'temceo',
//   name: null,
//   honor: 647,
//   clan: null,
//   leaderboardPosition: 90415,
//   skills: null,
//   ranks: {
//     overall: {
//       rank: -5,
//       name: '5 kyu',
//       color: 'yellow',
//       score: 632,
//     },
//     languages: {
//       ruby: {
//         rank: -8,
//         name: '8 kyu',
//         color: 'white',
//         score: 2,
//       },
//       javascript: {
//         rank: -5,
//         name: '5 kyu',
//         color: 'yellow',
//         score: 622,
//       },
//       java: {
//         rank: -8,
//         name: '8 kyu',
//         color: 'white',
//         score: 13,
//       },
//     },
//   },
//   codeChallenges: {
//     totalAuthored: 0,
//     totalCompleted: 136,
//   },
// };

// const overallScore = obj.ranks?.overall?.score ?? 0;
// const clan = obj?.clan ?? '-';
// const languages = new Set();
// const langs = obj.ranks?.languages;
// for (const lang of Object.keys(langs)) {
//   languages.add(lang);
// }
// const langs_scores = [];
// for (const [language, result] of Object.entries(langs)) {
//   langs_scores.push([language, result?.score ?? 0]);
// }
// console.log('overall score -->', overallScore);
// console.log('clan -->', clan);
// console.log('languages -->', languages);
// console.log(langs_scores);
