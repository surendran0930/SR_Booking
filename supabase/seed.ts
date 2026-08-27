import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Standalone script (run with `npm run db:seed`) — uses the service-role key
// to bypass RLS entirely, exactly like the old prisma/seed.ts did against
// the raw DB connection. NEVER run this against a production project; it
// wipes every business table first.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before seeding.",
  );
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "admin@srtechsolutions.com";
const CUSTOMER_EMAIL = "abc@computers.com";
const NIL = "00000000-0000-0000-0000-000000000000";

async function main() {
  console.log("Seeding SR TECH SOLUTIONS development data...");
  console.log("DEV ONLY — change admin password before production.");

  // Wipe existing rows (children first to respect FKs)
  for (const table of [
    "payments",
    "invoice_items",
    "invoices",
    "customers",
    "products",
    "services",
    "business_settings",
  ] as const) {
    const { error } = await supabase.from(table).delete().neq("id", NIL);
    if (error) throw new Error(`Failed clearing ${table}: ${error.message}`);
  }

  // Remove any auth users from a previous seed run
  const { data: existing } = await supabase.auth.admin.listUsers();
  for (const user of existing?.users ?? []) {
    if (user.email === ADMIN_EMAIL || user.email === CUSTOMER_EMAIL) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  await supabase.from("business_settings").insert({
    business_name: "SR TECH SOLUTIONS",
    tagline: "All Types Printer Repair & Support",
    business_address: "Your Business Address, City",
    phone: "9876543210",
    email: "info@srtechsolutions.com",
    gstin: "29AAAAA0000A1Z5",
    state: "Karnataka",
    pincode: "560001",
    invoice_prefix: "INV-",
    invoice_starting_number: 1,
    next_invoice_number: 1,
    logo_url: "/logo.png",
    terms_and_conditions:
      "1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Service charges are non-refundable.",
    bank_details: "Bank: Your Bank\nA/C: 0000000000\nIFSC: BANK0000000",
    upi_id: "srtech@upi",
  });

  const { error: adminErr } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: "ChangeMe123!",
    email_confirm: true,
    user_metadata: { name: "Admin", role: "ADMIN" },
  });
  if (adminErr) throw adminErr;

  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .insert([
      {
        customer_type: "BUSINESS",
        name: "Ramesh Kumar",
        company_name: "ABC Computers",
        phone: "9811111111",
        email: CUSTOMER_EMAIL,
        address: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        gstin: "29ABCDE1234F1Z5",
      },
      {
        customer_type: "BUSINESS",
        name: "Priya Sharma",
        company_name: "XYZ Photo Studio",
        phone: "9822222222",
        email: "xyz@photostudio.com",
        address: "45 Brigade Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560025",
      },
      {
        customer_type: "BUSINESS",
        name: "Lakshmi Devi",
        company_name: "Sri Lakshmi Xerox",
        phone: "9833333333",
        email: "srilakshmi@xerox.com",
        address: "78 Church Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
    ])
    .select();
  if (custErr || !customers) throw custErr ?? new Error("Failed to create customers");

  const { error: custUserErr } = await supabase.auth.admin.createUser({
    email: customers[0].email!,
    password: "Customer123!",
    email_confirm: true,
    user_metadata: {
      name: customers[0].name,
      phone: customers[0].phone,
      role: "CUSTOMER",
      customer_id: customers[0].id,
    },
  });
  if (custUserErr) throw custUserErr;

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .insert([
      { name: "Epson Original Ink", sku: "EPS-INK-001", brand: "Epson", category: "Ink", selling_price: 850, gst_percentage: 18, unit: "BOTTLE" },
      { name: "A4 Paper", sku: "PAP-A4-500", brand: "Generic", category: "Paper", selling_price: 280, gst_percentage: 12, unit: "REAM" },
      { name: "Printer", sku: "PRT-GEN-001", brand: "Epson", category: "Printer", selling_price: 12500, gst_percentage: 18, unit: "PCS" },
      { name: "Maintenance Box", sku: "EPS-MB-001", brand: "Epson", category: "Accessories", selling_price: 1200, gst_percentage: 18, unit: "PCS" },
    ])
    .select();
  if (prodErr || !products) throw prodErr ?? new Error("Failed to create products");

  const { data: services, error: svcErr } = await supabase
    .from("services")
    .insert([
      { name: "Printer General Service", service_code: "SVC-GEN", service_charge: 500, gst_percentage: 18 },
      { name: "Head Cleaning", service_code: "SVC-HEAD", service_charge: 350, gst_percentage: 18 },
      { name: "Ink Flow Service", service_code: "SVC-INK", service_charge: 400, gst_percentage: 18 },
      { name: "Printer Repair", service_code: "SVC-REP", service_charge: 800, gst_percentage: 18 },
    ])
    .select();
  if (svcErr || !services) throw svcErr ?? new Error("Failed to create services");

  // Sample sales invoice (inserted directly with an explicit number — the
  // create_invoice() RPC is for the app's normal flow, not needed here)
  const { data: salesInvoice, error: salesErr } = await supabase
    .from("invoices")
    .insert({
      invoice_number: "INV-0001",
      invoice_type: "SALES",
      customer_id: customers[0].id,
      invoice_date: new Date("2026-08-18").toISOString(),
      gst_mode: "CGST_SGST",
      subtotal: 12500,
      discount: 0,
      cgst: 1125,
      sgst: 1125,
      igst: 0,
      gst_total: 2250,
      grand_total: 14750,
      amount_paid: 14750,
      balance_due: 0,
      payment_status: "PAID",
    })
    .select()
    .single();
  if (salesErr || !salesInvoice) throw salesErr ?? new Error("Failed to create sales invoice");

  await supabase.from("invoice_items").insert({
    invoice_id: salesInvoice.id,
    item_type: "PRODUCT",
    product_id: products[2].id,
    description: "Printer",
    quantity: 1,
    unit_price: 12500,
    gst_percentage: 18,
    gst_amount: 2250,
    total_amount: 14750,
    sort_order: 0,
  });
  await supabase.from("payments").insert({
    invoice_id: salesInvoice.id,
    amount: 14750,
    payment_method: "UPI",
    payment_date: new Date("2026-08-18").toISOString(),
  });

  // Sample service invoice
  const { data: serviceInvoice, error: serviceErr } = await supabase
    .from("invoices")
    .insert({
      invoice_number: "INV-0002",
      invoice_type: "SERVICE",
      customer_id: customers[1].id,
      invoice_date: new Date("2026-08-15").toISOString(),
      gst_mode: "CGST_SGST",
      subtotal: 1350,
      discount: 0,
      cgst: 121.5,
      sgst: 121.5,
      igst: 0,
      gst_total: 243,
      grand_total: 1593,
      amount_paid: 500,
      balance_due: 1093,
      payment_status: "PARTIAL",
      printer_brand: "Epson",
      printer_model: "L3150",
      printer_serial: "EPS123456",
      customer_complaint: "Ink not flowing properly",
    })
    .select()
    .single();
  if (serviceErr || !serviceInvoice) throw serviceErr ?? new Error("Failed to create service invoice");

  await supabase.from("invoice_items").insert([
    {
      invoice_id: serviceInvoice.id,
      item_type: "SERVICE",
      service_id: services[0].id,
      description: "Printer General Service",
      quantity: 1,
      unit_price: 500,
      gst_percentage: 18,
      gst_amount: 90,
      total_amount: 590,
      sort_order: 0,
    },
    {
      invoice_id: serviceInvoice.id,
      item_type: "PRODUCT",
      product_id: products[0].id,
      description: "Epson Original Ink",
      quantity: 1,
      unit_price: 850,
      gst_percentage: 18,
      gst_amount: 153,
      total_amount: 1003,
      sort_order: 1,
    },
  ]);
  await supabase.from("payments").insert({
    invoice_id: serviceInvoice.id,
    amount: 500,
    payment_method: "CASH",
    payment_date: new Date("2026-08-15").toISOString(),
  });

  await supabase.from("business_settings").update({ next_invoice_number: 3 }).neq("id", NIL);

  console.log("Seed complete.");
  console.log(`Admin: ${ADMIN_EMAIL} / ChangeMe123!`);
  console.log(`Customer: ${CUSTOMER_EMAIL} / Customer123!`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
