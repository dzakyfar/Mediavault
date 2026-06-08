const calculateAdminFee = (amount) => Math.round(Number(amount || 0) * 0.01);

const calculateClientCharge = (baseAmount) => {
  const normalizedBase = Math.round(Number(baseAmount || 0));
  const adminFeeClient = calculateAdminFee(normalizedBase);

  return {
    baseAmount: normalizedBase,
    adminFeeClient,
    amountRequest: normalizedBase + adminFeeClient,
  };
};

const calculateFreelancerNet = (baseAmount) => {
  const normalizedBase = Math.round(Number(baseAmount || 0));
  const adminFeeWithdraw = calculateAdminFee(normalizedBase);

  return {
    adminFeeWithdraw,
    freelancerNet: normalizedBase - adminFeeWithdraw,
  };
};

module.exports = {
  calculateAdminFee,
  calculateClientCharge,
  calculateFreelancerNet,
};
