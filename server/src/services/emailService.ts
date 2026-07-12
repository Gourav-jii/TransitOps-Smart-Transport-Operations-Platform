import nodemailer from 'nodemailer';

// Configure transporter from environment variables (or fall back to a sandbox console transport)
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback dev mock transporter
  return {
    sendMail: async (options: any) => {
      console.log('----------------------------------------------------');
      console.log(`[Dev Mail Transport] To: ${options.to}`);
      console.log(`[Dev Mail Transport] Subject: ${options.subject}`);
      console.log(`[Dev Mail Transport] HTML Content:\n${options.html}`);
      console.log('----------------------------------------------------');
      return { messageId: 'mock-id-' + Date.now() };
    },
  } as any;
};

const transporter = getTransporter();

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    const fromEmail = process.env.SMTP_FROM || 'no-reply@transitops.com';
    await transporter.sendMail({
      from: `"TransitOps Notifications" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Send Email Error:', (error as Error).message);
    return false;
  }
};

/**
 * Driver License Expiring template
 */
export const sendDriverLicenseExpiringAlert = async (email: string, driverName: string, expiryDate: Date) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString();
  const html = `
    <h2>Driver License Expiry Alert</h2>
    <p>Dear Administrator / Safety Officer,</p>
    <p>Please note that the driver license for <strong>${driverName}</strong> is expiring on <strong>${formattedDate}</strong>.</p>
    <p>Please coordinate with the driver to submit renewal documents immediately to maintain compliance status.</p>
    <br/>
    <p>Sincerely,</p>
    <p>TransitOps Dispatch Engine</p>
  `;
  return sendEmail({ to: email, subject: `Compliance Alert: Driver ${driverName} License Expiry`, html });
};

/**
 * Insurance Expiring template
 */
export const sendInsuranceExpiringAlert = async (email: string, vehicleReg: string, expiryDate: Date) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString();
  const html = `
    <h2>Vehicle Insurance Expiry Alert</h2>
    <p>Please note that the insurance certificate for vehicle plate <strong>${vehicleReg}</strong> is set to expire on <strong>${formattedDate}</strong>.</p>
    <p>Renew insurance immediately to avoid insurance compliance violations.</p>
    <br/>
    <p>TransitOps Auto Compliance Engine</p>
  `;
  return sendEmail({ to: email, subject: `Compliance Alert: Vehicle ${vehicleReg} Insurance Expiry`, html });
};

/**
 * Fitness Cert Expiring template
 */
export const sendFitnessExpiringAlert = async (email: string, vehicleReg: string, expiryDate: Date) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString();
  const html = `
    <h2>Vehicle Fitness Certificate Expiry Alert</h2>
    <p>Please note that the fitness certificate for vehicle <strong>${vehicleReg}</strong> is set to expire on <strong>${formattedDate}</strong>.</p>
    <p>Submit fitness logs to prevent transit restrictions.</p>
    <br/>
    <p>TransitOps Auto Compliance Engine</p>
  `;
  return sendEmail({ to: email, subject: `Compliance Alert: Vehicle ${vehicleReg} Fitness Expiry`, html });
};

/**
 * Pollution Cert Expiring template
 */
export const sendPollutionExpiringAlert = async (email: string, vehicleReg: string, expiryDate: Date) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString();
  const html = `
    <h2>Vehicle Pollution Certificate Expiry Alert</h2>
    <p>Please note that the pollution certificate for vehicle <strong>${vehicleReg}</strong> is set to expire on <strong>${formattedDate}</strong>.</p>
    <br/>
    <p>TransitOps Auto Compliance Engine</p>
  `;
  return sendEmail({ to: email, subject: `Compliance Alert: Vehicle ${vehicleReg} Pollution Expiry`, html });
};

/**
 * Maintenance Scheduled template
 */
export const sendMaintenanceScheduledAlert = async (email: string, vehicleReg: string, scheduledDate: Date) => {
  const formattedDate = new Date(scheduledDate).toLocaleDateString();
  const html = `
    <h2>Maintenance Scheduled</h2>
    <p>Maintenance service has been scheduled for vehicle <strong>${vehicleReg}</strong> on <strong>${formattedDate}</strong>.</p>
    <p>Please coordinate with the shop to release the vehicle for inspection.</p>
    <br/>
    <p>TransitOps Fleet Management</p>
  `;
  return sendEmail({ to: email, subject: `Maintenance Schedule: Vehicle ${vehicleReg}`, html });
};

/**
 * Maintenance Overdue template
 */
export const sendMaintenanceOverdueAlert = async (email: string, vehicleReg: string, overdueDate: Date) => {
  const formattedDate = new Date(overdueDate).toLocaleDateString();
  const html = `
    <h2><span style="color:red">Alert: Maintenance Overdue</span></h2>
    <p>Vehicle <strong>${vehicleReg}</strong> has passed its scheduled maintenance date of <strong>${formattedDate}</strong> without completion.</p>
    <p>Please dispatch the vehicle to the shop immediately to ensure safety compliance.</p>
    <br/>
    <p>TransitOps Safety & Fleet Compliance</p>
  `;
  return sendEmail({ to: email, subject: `ALERT: Maintenance OVERDUE for Vehicle ${vehicleReg}`, html });
};

/**
 * Weekly Fleet Summary template
 */
export const sendWeeklyFleetSummaryAlert = async (email: string, stats: any) => {
  const html = `
    <h2>Weekly Fleet Operations Summary</h2>
    <p>Here are the fleet stats for the past week:</p>
    <ul>
      <li>Active Vehicles: <strong>${stats.activeVehicles}</strong></li>
      <li>Completed Trips: <strong>${stats.completedTrips}</strong></li>
      <li>Total Cargo Hauled: <strong>${stats.totalCargo.toLocaleString()} kg</strong></li>
      <li>Total Distance Logged: <strong>${stats.totalDistance.toLocaleString()} km</strong></li>
      <li>Safety Incidents: <strong>${stats.safetyIncidents}</strong></li>
    </ul>
    <p>For detailed breakdowns, please log in to the TransitOps Operations Panel.</p>
    <br/>
    <p>TransitOps Reporter Engine</p>
  `;
  return sendEmail({ to: email, subject: `Weekly Fleet Summary Report`, html });
};

/**
 * Monthly Financial Summary template
 */
export const sendMonthlyFinancialSummaryAlert = async (email: string, stats: any) => {
  const html = `
    <h2>Monthly Financial Summary Report</h2>
    <p>Operational stats for the current month:</p>
    <ul>
      <li>Total Operations Revenue: <strong>$${stats.revenue.toLocaleString()}</strong></li>
      <li>Fuel Cost OPEX: <strong>$${stats.fuelCost.toLocaleString()}</strong></li>
      <li>Maintenance Cost OPEX: <strong>$${stats.maintenanceCost.toLocaleString()}</strong></li>
      <li>Other Cost OPEX: <strong>$${stats.otherExpenses.toLocaleString()}</strong></li>
      <li>Net Settlement Profit: <strong>$${stats.netProfit.toLocaleString()}</strong></li>
      <li>Average Fleet ROI: <strong>${stats.roi}%</strong></li>
    </ul>
    <p>Audit invoices are available on the Expense Ledger.</p>
    <br/>
    <p>TransitOps Finance Engine</p>
  `;
  return sendEmail({ to: email, subject: `Monthly Fleet Financial Statement`, html });
};
