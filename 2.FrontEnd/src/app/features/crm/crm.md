# CRM – Quản lý Khách hàng (Customer Relationship Management)

**Prefix:** CRM | **Right root:** R21 | **Menu root:** M21 | **Phase:** 1

---

## 1. Mục tiêu & Phạm vi

Quản lý toàn bộ vòng đời khách hàng theo luồng:

```
Lead → Opportunity → Customer → Sales → Hậu mãi
```

Phạm vi chính:
- Hồ sơ khách hàng (cá nhân / doanh nghiệp) và người liên hệ
- Quản lý cơ hội bán hàng (sales pipeline) theo stage
- Báo giá – đặt hàng – hợp đồng (link CTR)
- Chiến dịch marketing & nguồn lead
- Tương tác (call / email / meeting log)
- Hậu mãi / ticket (link HLP)

---

## 2. Actor & Use Case

| Actor | Use Case |
|---|---|
| **Sales Manager** | Quản lý pipeline, phân công nhân viên, dự báo doanh thu |
| **Sales Staff** | Tạo lead, theo dõi opportunity, làm báo giá, ghi nhật ký tương tác |
| **Marketing** | Tạo campaign, import lead, đo hiệu quả |
| **Customer Service** | Tiếp nhận ticket sau bán, cập nhật thông tin khách |
| **Manager** | Xem dashboard pipeline, conversion rate |

### Luồng chính

```
[Marketing] tạo Campaign ──► import CrmLead ──► [Sales] qualify
                                                    │
                                                    ▼
                                            CrmOpportunity (Pipeline)
                                            stage: PROSPECTING → QUALIFIED
                                                  → PROPOSAL → NEGOTIATION
                                                  → WON / LOST
                                                    │ WON
                                                    ▼
                                            CrmCustomer + Contract (CTR)
                                                    │
                                                    ▼
                                            CrmActivity (post-sales)
```

---

## 3. Nghiệp vụ chi tiết

### 3.1 Khách hàng (CrmCustomer)

**Mô tả:** Lưu trữ thông tin hồ sơ khách hàng – có thể là cá nhân (INDIVIDUAL) hoặc doanh nghiệp (COMPANY).

**Trạng thái (Status):**
| Code | Ý nghĩa |
|---|---|
| `LEAD` | Khách tiềm năng chưa xác nhận |
| `ACTIVE` | Đang giao dịch |
| `INACTIVE` | Không còn giao dịch |
| `BLACKLIST` | Danh sách đen |

**Các trường quan trọng:**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `Code` | NVARCHAR(50) UNIQUE | Mã tự sinh: KH00001 |
| `CustomerType` | NVARCHAR(20) | `INDIVIDUAL` / `COMPANY` |
| `GroupId` | FK → CrmCustomerGroup | Nhóm khách hàng (VIP, ngành, vùng) |
| `OwnerUser` | NVARCHAR(100) | Sales phụ trách |
| `TotalRevenue` | DECIMAL(18,2) | Tổng doanh thu từ các deal đã WON |
| `ConvertedFromLeadId` | NVARCHAR(50) | Nếu KH được convert từ Lead |

**API:**
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/Crm/Customer/Search` | Tìm kiếm, phân trang |
| GET | `/api/Crm/Customer/Detail/{id}` | Chi tiết kèm contact, activity, opp |
| POST | `/api/Crm/Customer/Insert` | Tạo mới |
| POST | `/api/Crm/Customer/Update` | Cập nhật |
| POST | `/api/Crm/Customer/Delete` | Xóa |
| POST | `/api/Crm/Customer/Merge` | Gộp khách trùng |
| POST | `/api/Crm/Customer/Assign` | Chuyển owner |
| GET | `/api/Crm/Customer/Export` | Xuất Excel |

---

### 3.2 Người liên hệ (CrmContact)

**Mô tả:** Danh sách người liên hệ thuộc một khách hàng doanh nghiệp (1 KH có nhiều Contact).

**Các trường quan trọng:**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `CustomerId` | FK → CrmCustomer | KH sở hữu |
| `Title` | NVARCHAR(100) | Chức danh |
| `Department` | NVARCHAR(100) | Phòng ban |
| `Role` | NVARCHAR(100) | Vai trò trong giao dịch |

---

### 3.3 Nhóm khách hàng (CrmCustomerGroup)

**Mô tả:** Phân loại khách hàng theo nhóm (VIP, theo ngành nghề, vùng địa lý...).

**Các trường quan trọng:**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `Code` | NVARCHAR(50) UNIQUE | Mã nhóm |
| `Category` | NVARCHAR(100) | Loại nhóm (VIP / Industry / Region) |

---

### 3.4 Địa chỉ khách hàng (CrmCustomerAddress)

**Mô tả:** Nhiều địa chỉ trên một khách hàng (billing, shipping, warehouse...).

**AddressType:** `BILLING` / `SHIPPING` / `OTHER`

---

### 3.5 Lead (CrmLead)

**Mô tả:** Khách hàng tiềm năng chưa được qualify. Có thể được import hàng loạt từ Excel hoặc thu thập từ Campaign.

**Trạng thái (Status):**
| Code | Ý nghĩa |
|---|---|
| `NEW` | Mới tạo |
| `WORKING` | Đang tiếp cận |
| `QUALIFIED` | Đủ điều kiện, sẵn sàng convert |
| `DISQUALIFIED` | Loại bỏ |
| `CONVERTED` | Đã convert thành Customer + Opportunity |

**Các trường quan trọng:**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `Code` | NVARCHAR(50) UNIQUE | Mã tự sinh: LD0001 |
| `Score` | INT | Điểm chấm tự động (lead scoring) |
| `SourceCode` | FK → CrmLeadSource | Nguồn tiếp cận |
| `CampaignId` | FK → CrmCampaign | Campaign tạo ra lead này |
| `ConvertedCustomerId` | NVARCHAR(50) | KH được tạo sau convert |
| `ConvertedOpportunityId` | NVARCHAR(50) | Opp được tạo sau convert |

**API:**
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/Crm/Lead/Search` | Tìm kiếm |
| POST | `/api/Crm/Lead/Insert` | Tạo mới |
| POST | `/api/Crm/Lead/Update` | Cập nhật |
| POST | `/api/Crm/Lead/Delete` | Xóa |
| POST | `/api/Crm/Lead/Import` | Bulk import từ Excel |
| POST | `/api/Crm/Lead/Convert/{id}` | Convert → tạo Customer + Opportunity |

#### Sequence – Lead Convert

```
Sales      Client(LeadForm)      CRM Service        WF Service     Notify
│             │                      │                  │            │
├─ qualify   │                      │                  │            │
│             ├─ POST /Lead/Convert  │                  │            │
│             │  {leadId}            │                  │            │
│             ├─────────────────────►│                  │            │
│             │                      ├─ Insert Customer │            │
│             │                      ├─ Insert Opp      │            │
│             │                      ├─ Update Lead.Status=CONVERTED │
│             │                      ├─ Log Activity    │            │
│             │                      ├─────────────────►│ Notify Owner
│             │◄─── 0100 ────────────┤                  │            │
```

---

### 3.6 Nguồn Lead (CrmLeadSource)

**Mô tả:** Danh mục nguồn tiếp cận lead (Facebook, Website, Referral, Event...).

---

### 3.7 Chiến dịch (CrmCampaign)

**Mô tả:** Quản lý chiến dịch marketing. Mỗi campaign có danh sách lead (CrmCampaignMember) và đo ROI theo công thức: `ROI = Tổng opp WON ÷ Budget`.

**Trạng thái (Status):** `PLANNING` / `ACTIVE` / `COMPLETED` / `CANCELLED`

**API:**
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/Crm/Campaign/Search` | Tìm kiếm |
| POST | `/api/Crm/Campaign/Insert\|Update\|Delete` | CRUD |
| POST | `/api/Crm/Campaign/AddMembers` | Thêm lead vào campaign |
| GET | `/api/Crm/Campaign/ROI` | Tính ROI |

---

### 3.8 Cơ hội bán hàng (CrmOpportunity)

**Mô tả:** Trung tâm của sales pipeline. Theo dõi tiến trình đàm phán từ khi tiếp cận đến khi WON/LOST.

**Stage Pipeline:**
| Code | Tên | Ý nghĩa |
|---|---|---|
| `PROSPECTING` | Tìm kiếm | Xác định nhu cầu |
| `QUALIFIED` | Đủ điều kiện | KH có ngân sách, nhu cầu rõ |
| `PROPOSAL` | Đề xuất | Đã gửi báo giá / đề xuất |
| `NEGOTIATION` | Đàm phán | Đang thương lượng điều khoản |
| `WON` | Thắng | Ký hợp đồng thành công |
| `LOST` | Thua | Mất deal |

**Các trường quan trọng:**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `Code` | NVARCHAR(50) UNIQUE | Mã: OPP0001 |
| `Amount` | DECIMAL(18,2) | Giá trị dự kiến |
| `Probability` | INT | % khả năng thắng |
| `ExpectedRevenue` | DECIMAL(18,2) | `Amount × Probability / 100` |
| `CloseDate` | DATE | Dự kiến chốt |
| `LossReason` | NVARCHAR(500) | Lý do thua (khi LOST) |
| `CompetitorId` | FK → CrmCompetitor | Đối thủ cạnh tranh |

**API:**
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/Crm/Opportunity/Search` | Tìm kiếm |
| GET | `/api/Crm/Opportunity/Pipeline` | Dữ liệu Kanban board (nhóm theo stage) |
| POST | `/api/Crm/Opportunity/ChangeStage/{id}` | Kéo thả đổi stage |
| POST | `/api/Crm/Opportunity/Won/{id}` | Đánh dấu WON |
| POST | `/api/Crm/Opportunity/Lost/{id}` | Đánh dấu LOST |
| GET | `/api/Crm/Opportunity/Forecast` | Dự báo doanh thu theo khoảng thời gian |

---

### 3.9 Báo giá (CrmQuotation & CrmQuotationItem)

**Mô tả:** Tạo báo giá cho customer hoặc gắn với một opportunity. Có thể gửi qua email, phê duyệt qua workflow, và convert sang Contract/SalesOrder.

**Trạng thái (Status):** `DRAFT` / `SENT` / `APPROVED` / `REJECTED` / `EXPIRED` / `CONVERTED`

**Cấu trúc:** 1 CrmQuotation → nhiều CrmQuotationItem (dòng sản phẩm/dịch vụ)

**API:**
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/Crm/Quotation/Search\|Insert\|Update\|Delete` | CRUD |
| POST | `/api/Crm/Quotation/Send` | Gửi qua email |
| POST | `/api/Crm/Quotation/Approve` | Phê duyệt (qua WF: `CRM_QUOTATION_APPROVE`) |
| POST | `/api/Crm/Quotation/Convert` | Convert sang Contract / SalesOrder |

---

### 3.10 Hoạt động tương tác (CrmActivity)

**Mô tả:** Log tất cả tương tác với khách hàng / lead / opportunity. Có thể đồng bộ với Calendar.

**Loại hoạt động (ActivityType):**
| Code | Ý nghĩa |
|---|---|
| `CALL` | Cuộc gọi điện |
| `EMAIL` | Email trao đổi |
| `MEETING` | Cuộc họp (sync Calendar) |
| `NOTE` | Ghi chú |
| `TASK` | Công việc cần làm |

**RelatedType:** `LEAD` / `OPP` / `CUSTOMER` (đa hình – liên kết đến bất kỳ entity nào)

**Trạng thái (Status):** `PLANNED` / `COMPLETED` / `CANCELLED`

**API:**
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/Crm/Activity/Search\|Insert\|Update\|Delete` | CRUD |
| GET | `/api/Crm/Activity/My-Today` | Hoạt động của tôi hôm nay |
| GET | `/api/Crm/Activity/My-Upcoming` | Hoạt động sắp tới |
| POST | `/api/Crm/Activity/Calendar-Sync` | Đồng bộ lên CalendarEvent |

---

### 3.11 Sản phẩm / Dịch vụ (CrmProduct)

**Mô tả:** Danh mục sản phẩm và dịch vụ dùng trong báo giá và opportunity.

| Cột | Ghi chú |
|---|---|
| `UnitPrice` | Giá mặc định |
| `UnitOfMeasure` | Đơn vị tính |
| `IsService` | Phân biệt hàng hóa và dịch vụ |

---

### 3.12 Bảng giá (CrmPriceList)

**Mô tả:** Bảng giá riêng theo nhóm khách hàng hoặc thị trường.

---

### 3.13 Đối thủ cạnh tranh (CrmCompetitor)

**Mô tả:** Danh sách đối thủ để gắn vào opportunity khi LOST, phân tích tại sao thua.

---

## 4. Sơ đồ quan hệ (ERD)

```
   ┌──────────────┐
   │ CrmCampaign  │
   └──────┬───────┘
          │ CrmCampaignMember
          ▼
   ┌──────────────┐  convert  ┌──────────────┐
   │   CrmLead    ├──────────►│ CrmCustomer  │◄── CrmCustomerGroup
   └──────┬───────┘           └──────┬───────┘
          │ convert                   │ 1:N
          ▼                           ├──► CrmContact
   ┌────────────────┐                 └──► CrmCustomerAddress
   │CrmOpportunity  │◄───── CustomerId
   └───┬──────┬─────┘
       │      │
       ▼      ▼
 ┌──────────┐  ┌────────────────┐
 │CrmQuota- │  │ CrmActivity    │── sync ──► CalendarEvent
 │tion      │  └────────────────┘
 └─────┬────┘
       │ 1:N
       ▼
 CrmQuotationItem
       │
       └──► CrmProduct ◄── CrmOpportunityProduct ◄── CrmOpportunity
```

---

## 5. Frontend

### 5.1 Routes

```
/crm
  ├─ /dashboard            (R21.0)  – Pipeline funnel + revenue chart
  ├─ /customer             (R21.1)  – Danh sách khách hàng
  ├─ /customer/:id         (R21.1)  – Chi tiết KH
  ├─ /lead                 (R21.2)  – Danh sách lead
  ├─ /opportunity          (R21.3)  – Danh sách cơ hội
  ├─ /opportunity/board    (R21.3)  – Kanban pipeline board
  ├─ /quotation            (R21.4)  – Báo giá
  ├─ /activity             (R21.5)  – Lịch hoạt động
  ├─ /campaign             (R21.6)  – Chiến dịch marketing
  ├─ /product              (R21.7)  – Sản phẩm / dịch vụ
  └─ /master-data          (R21.9)  – Danh mục: Group, Source, Stage, Competitor
```

### 5.2 Components

| Component | Mô tả |
|---|---|
| `crm-dashboard` | Pipeline funnel + revenue chart + top customers |
| `crm-customer-list` | Table + filter + bulk action (assign, export) |
| `crm-customer-detail` | Tabs: Info / Contact / Opp / Activity / Quote / Document |
| `crm-lead-list` | Table + bulk action (assign, convert, delete) |
| `crm-opportunity-board` | Kanban drag-drop đổi stage (gọi `ChangeStage`) |
| `crm-opportunity-detail` | Timeline activity, sản phẩm, báo giá liên kết |
| `crm-quotation-editor` | Header + dòng sản phẩm + tính tổng (giống invoice editor) |
| `crm-activity-calendar` | Calendar view hiển thị MEETING/TASK |
| `crm-campaign-detail` | ROI calc + member list |

---

## 6. Phân quyền (Permissions)

| Right | Tên | Ghi chú |
|---|---|---|
| R21 | CRM Root | |
| R21.0 | Dashboard | |
| R21.1 | Khách hàng | |
| R21.1.W | Sửa khách hàng | |
| R21.1.OWN | Chỉ xem khách của tôi | Filter ngầm theo `OwnerUser` |
| R21.2 | Lead | |
| R21.3 | Cơ hội | |
| R21.4 | Báo giá | |
| R21.5 | Hoạt động | |
| R21.6 | Chiến dịch | |
| R21.7 | Sản phẩm | |
| R21.9 | Master data CRM | Danh mục cấu hình |

---

## 7. Tích hợp module khác

| Module | Tích hợp |
|---|---|
| **AD** | `OwnerUser` link tới `AdAccount` |
| **Mail** | Gửi báo giá, log email vào `CrmActivity` |
| **Calendar** | `ActivityType = MEETING` → tạo `CalendarEvent` |
| **WF** | Workflow `CRM_QUOTATION_APPROVE` cho báo giá vượt ngưỡng |
| **CTR** | Opportunity WON → tự động tạo Contract |
| **HLP** | Hiển thị ticket của KH trong tab Customer Detail |
| **DSB** | Widget pipeline & revenue trên Dashboard chung |

---

## 8. Phase rollout

| Phase | Nội dung |
|---|---|
| 2.1 | Customer + Contact + Group |
| 2.2 | Lead + Campaign + Import |
| 2.3 | Opportunity + Pipeline board |
| 2.4 | Quotation + Product |
| 2.5 | Activity + Mail/Calendar sync + Dashboard |
