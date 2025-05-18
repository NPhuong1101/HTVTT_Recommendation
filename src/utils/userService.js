const users = [
  {
    id: 1,
    email: 'nguyenvana@gmail.com',
    password: '123456',
    profile: {
      name: "Nguyễn Văn A",
      dob: "01/01/1990",
      avatar: "user1.png"
    },
    travelHistory: [
      { placeId: "1", date: "2024-03-10", review: "..." },
      { placeId: "2", date: "2023-12-15", review: "..." }
    ]
  }
];

export const login = (email, password) => {
  return users.find(u => u.email === email && u.password === password);
};

export const register = (userData) => {
  const newUser = {
    id: users.length + 1,
    ...userData,
    travelHistory: []
  };
  users.push(newUser);
  return newUser;
};

export const updateTravelHistory = (userId, history) => {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.travelHistory = history;
    return true;
  }
  return false;
};