export async function getPrices() {
  const data = [
    {
      id: 1,
      amount: 1000,
      title: "One time Price 1",
    },
    {
      id: 2,
      amount: 1000,
      title: "One time Price 2",
    },
    {
      id: 3,
      amount: 1500,
      credits: 10,
      title: "10 credits",
    },
    {
      id: 4,
      amount: 3000,
      credits: 25,
      title: "25 credits",
    },
  ];
  return data;
}
