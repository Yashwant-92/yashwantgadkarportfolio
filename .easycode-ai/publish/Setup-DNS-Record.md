## Custom Domain DNS Configuration Guide

**Domain**: yashwantgadkarportfolio.com

Please add the following records in the DNS console of your domain provider (Cloudflare, GoDaddy, Namecheap, Alibaba Cloud, Tencent Cloud, Google Domains, etc.):

### Records to Add

| Type | Name | Value | TTL | Description |
|---|---|---|---|---|
| A | @ | 216.150.1.1 | Auto/300s | Required: Make yashwantgadkarportfolio.com direct to the site |
| CNAME | www | 2fc147e436ca7e81.vercel-dns-016.com. | Auto/300s | Optional: Make www.yashwantgadkarportfolio.com also accessible |

### Operation Steps (Common)

1. Login to your domain provider backend, open the DNS (DNS Management/Resolution/Zone Settings) of the domain.
2. Click "Add Record/Add record".
3. Add records one by one according to the table:
   - Record Type(Type): Select A or CNAME.
   - Host Record(Name):
     - Top-level Domain(such as yashwantgadkarportfolio.com) use "@"(some suppliers leave empty to represent @).
     - Subdomain(such as yashwantgadkarportfolio.com) use prefix "@".
   - Value: Paste the complete value as shown in the table.
   - TTL: Select Auto or 300 seconds.
4. Save records, repeat the remaining records in the table.

### Supplier Considerations

- **Cloudflare**: After creation, if the "orange cloudlet (proxy)" icon appears, please click it to change it to "gray (only DNS)", and then enable the proxy as needed after the domain takes effect.
- **GoDaddy/Namecheap**: If "@" is not accepted, please leave Name empty to represent the root domain.
- **Alibaba Cloud/Tencent Cloud**: The host record "@" represents the root domain, and the subdomain only needs to fill in the prefix (such as blog), do not include the entire domain name.
- **Subdomain Access**: If the subdomain (such as blog.yashwantgadkarportfolio.com) is accessed, usually only the CNAME record in the table needs to be added.

### Verification and Effective Time

- DNS takes effect usually takes 1–30 minutes, and in rare cases it can take up to 24 hours.
- After saving, return to the extension, and Vercel will automatically verify.
- If the verification fails, please carefully check whether the "host record" and "value/target" correspond one by one, and whether there are redundant/conflicting old records.

### Common Problem Troubleshooting

- Do not have multiple A/CNAME conflict records under the same host name (for example, there are two A records or one A + one CNAME pointing to different targets at the same time).
- The top-level domain needs to use A record to point to 216.150.1.1; if the supplier supports ALIAS/ANAME, it can also be configured according to the documentation.
- Using company network or proxy may cause DNS cache, please try to refresh the DNS cache locally or use a mobile hotspot to test.