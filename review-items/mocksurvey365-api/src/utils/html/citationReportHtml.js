module.exports = ({ survey, groupedCitations }) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS-2567 Statement of Deficiencies and Plan of Correction</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            background: #fff;
            padding: 0.5in;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }

        .header-right {
            text-align: right;
            font-size: 11px;
        }

        .form-title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .form-subtitle {
            text-align: center;
            font-size: 10px;
            margin-bottom: 20px;
        }

        .top-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            align-items: flex-start;
            gap: 10px;
        }

        .left-title-box {
            width: 60%;
            border: 1px solid #000;
            padding: 15px;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .left-title-box .title-text {
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
            text-align: center;
        }

        .right-info-boxes {
            width: 38%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto auto auto;
            gap: 2px;
        }

        .info-box {
            border: 1px solid #000;
            padding: 6px;
            font-size: 10px;
        }

        .info-box.span-two {
            grid-column: 1 / 3;
            min-height: 35px;
        }

        .info-box.single {
            min-height: 35px;
        }

        .info-box.construction {
            min-height: 35px;
        }

        .label {
            font-weight: bold;
            margin-bottom: 2px;
            font-size: 9px;
        }

        .value {
            font-size: 10px;
        }

        .construction-labels {
            display: flex;
            gap: 15px;
        }

        .construction-label {
            font-weight: bold;
            font-size: 9px;
        }

        .date-section {
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .date-letter {
            font-size: 12px;
            font-weight: bold;
        }

        .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }

        .main-table th,
        .main-table td {
            border: 1px solid #000;
            padding: 4px;
            vertical-align: top;
        }

        .main-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
            padding: 6px 4px;
        }

        .id-tag {
            width: 70px;
            text-align: center;
            font-weight: bold;
        }

        .summary-column {
            width: 50%;
        }

        .correction-column {
            width: 20%;
        }

        .completion-column {
            width: 90px;
            text-align: center;
        }

        .deficiency-content {
            font-size: 9px;
            line-height: 1.3;
        }

        .deficiency-title {
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
            font-size: 10px;
        }

        .abbreviations {
            margin-top: 8px;
        }

        .abbreviation {
            margin-bottom: 1px;
            font-size: 9px;
        }

        .regulation {
            margin-top: 8px;
            font-size: 8px;
            line-height: 1.3;
        }

        .footer {
            margin-top: 25px;
        }

        .signature-section {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }

        .signature-box {
            flex: 1;
        }

        .signature-line {
            border-bottom: 1px solid #000;
            height: 15px;
            margin-bottom: 3px;
        }

        .signature-label {
            font-size: 9px;
            font-weight: bold;
        }

        .disclaimer {
            font-size: 8px;
            line-height: 1.3;
            margin-bottom: 10px;
        }

        .page-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
        }

        /* Print-specific styles */
        @media print {
            body {
                padding: 0;
            }
            
            .page-break {
                page-break-before: always;
            }
        }

        /* PDF generation optimization */
        .pdf-optimized {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
        }
    </style>
</head>
<body class="pdf-optimized">
    <!-- Page Header -->
    <div class="page-header">
        <div></div>
        <div class="header-right">
            <div>Date Printed: <span id="currentDate"> ${new Date().toLocaleDateString()}</span></div>
        </div>
    </div>

    <!-- Form Title -->
    <div class="form-title">STATEMENT OF DEFICIENCIES AND PLAN OF CORRECTION</div>
    

    <!-- Top Section with Title Box and Info Boxes -->
    <div class="top-section">
        <div class="left-title-box">
            <div class="title-text">STATEMENT OF DEFICIENCIES AND PLAN OF CORRECTION</div>
        </div>
        
        <div class="right-info-boxes">
            <!-- Row 1: X1 box -->
            <div class="info-box single">
                <div class="label">(X1) PROVIDER NUMBER:</div>
                <div class="value" id="providerId">${survey?.facilityId?.providerNumber}</div>
            </div>
            
         
            
            <!-- Row 3: X3 box -->
            <div class="info-box single">
                <div class="label">DATE SURVEY COMPLETED</div>
                <div class="date-section">
                    <span class="date-letter">C</span>
                    <div class="value" id="surveyDate">${new Date(survey?.updatedAt).toLocaleDateString()}</div>
                </div>
            </div>
            
            <!-- Row 4: Provider name spanning two columns -->
            <div class="info-box span-two">
                <div class="label">NAME OF PROVIDER OR SUPPLIER</div>
                <div class="value" id="providerName">${survey?.facilityId?.name}</div>
            </div>
            
            <!-- Row 5: Address spanning two columns -->
            <div class="info-box span-two">
                <div class="label">STREET ADDRESS, CITY, STATE, ZIP CODE</div>
                <div class="value" id="providerAddress">${survey?.facilityId?.address?.street} ${survey?.facilityId?.address?.city} ${survey?.facilityId?.address?.state} ${survey?.facilityId?.address?.zipCode}</div>
            </div>
        </div>
    </div>

    <!-- Main Deficiencies Table -->
    <table class="main-table">
        <thead>
            <tr>
                <th class="id-tag">ID PREFIX TAG</th>
                <th class="summary-column">SUMMARY STATEMENT OF DEFICIENCIES (EACH DEFICIENCY MUST BE PRECEDED BY FULL REGULATORY OR LSC IDENTIFYING INFORMATION)</th>
                <th class="id-tag">ID PREFIX TAG</th>
                <th class="correction-column">PROVIDER'S PLAN OF CORRECTION (EACH CORRECTIVE ACTION SHOULD BE CROSS-REFERENCED TO THE APPROPRIATE DEFICIENCY)</th>
                <th class="completion-column">COMPLETION DATE</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="id-tag">F 000</td>
                <td class="summary-column">
                    <div class="deficiency-content">
                        <div class="deficiency-title">INITIAL COMMENTS</div>
                        <div>Census: <span id="census">${survey?.census ?? ''}</span></div>
                        <div>Purpose of Visit: <span id="purposeOfVisit">${survey?.surveyCategory ?? ''}</span></div>
                        <div>Entrance <span id="entranceDate">${new Date(survey?.surveyCreationDate).toLocaleDateString()}</span></div>
                        <div>Tx# <span id="transactionNumber">${survey?._id ?? ''}</span></div>
                        
                        <div class="abbreviations">
                            <div class="abbreviation"><strong>ADON</strong> Assistant Director of Nursing</div>
                            <div class="abbreviation"><strong>BIMS</strong> Brief interview of mental status</div>
                            <div class="abbreviation"><strong>CNA</strong> Certified Nurse Aide</div>
                            <div class="abbreviation"><strong>DON</strong> Director of Nursing</div>
                            <div class="abbreviation"><strong>Dx</strong> Diagnosis</div>
                            <div class="abbreviation"><strong>LVN</strong> Licensed Vocational Nurse</div>
                            <div class="abbreviation"><strong>MD</strong> Medical Doctor</div>
                            <div class="abbreviation"><strong>MDS</strong> Minimum Data Set</div>
                            <div class="abbreviation"><strong>PRN</strong> as needed</div>
                            <div class="abbreviation"><strong>RP</strong> Responsible Party</div>
                        </div>
                    </div>
                </td>
                <td class="id-tag">F 000</td>
                <td class="correction-column">
                    <div class="value" id="correctionPlan000"></div>
                </td>
                <td class="completion-column">
                    <div class="value" id="completionDate000"></div>
                </td>
            </tr>

            ${groupedCitations.map((finding, index) => `
            <tr>
                <td class="id-tag">${finding?.ftag || ''}</td>
                <td class="summary-column">
                    <div class="deficiency-content">
                        <div class="deficiency-title">${finding?.title || finding?.ftag || ''}</div>
                        
                        ${finding?.regulatoryRequirement ? `
                        <div class="regulation" style="margin-top: 10px;">
                            <strong>Regulatory Requirement:</strong><br/>
                            ${finding.regulatoryRequirement}
                        </div>
                        ` : ''}

                        ${finding?.intent ? `
                        <div class="regulation" style="margin-top: 8px;">
                            <strong>Intent of the Regulation:</strong><br/>
                            ${finding.intent}
                        </div>
                        ` : ''}

                        ${finding?.deficiencyStatement ? `
                        <div class="regulation" style="margin-top: 8px;">
                            <strong>Deficiency Statement:</strong><br/>
                            ${finding.deficiencyStatement}
                        </div>
                        ` : ''}

                        ${finding?.detailedFindings && finding.detailedFindings.length > 0 ? `
                        <div class="regulation" style="margin-top: 8px;">
                            <strong>Findings:</strong><br/>
                            ${finding.detailedFindings.map((detail, idx) => `
                                <div style="margin-top: 4px; margin-left: 10px;">
                                    ${detail}
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}

                        ${finding?.residentsCited && finding.residentsCited.length > 0 ? `
                        <div class="regulation" style="margin-top: 8px;">
                            <strong>Residents Cited:</strong> ${finding.residentsCited.join(', ')}
                        </div>
                        ` : ''}

                        ${finding?.recommendations && finding.recommendations.length > 0 ? `
                        <div class="regulation" style="margin-top: 8px;">
                            <strong>Recommendations / FYIs:</strong><br/>
                            ${finding.recommendations.map((rec, idx) => `
                                <div style="margin-top: 3px; margin-left: 10px;">• ${rec}</div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </td>
                <td class="id-tag">${finding?.ftag || ''}</td>
                <td class="correction-column">
                    <div class="value"></div>
                </td>
                <td class="completion-column">
                    <div class="value"></div>
                </td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- Positive Observations Section -->
    <div style="margin-top: 30px; margin-bottom: 30px; page-break-inside: avoid;">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 10px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px;">
            Positive Observations and Facility Strengths
        </div>
        <div style="font-size: 10px; line-height: 1.5;">
            <div style="margin-bottom: 5px;">• Facility was clean with no odors; residents appeared well-groomed and calm.</div>
            <div style="margin-bottom: 5px;">• Strong teamwork from leadership to frontline staff.</div>
            <div style="margin-bottom: 5px;">• DON demonstrated professional leadership; staff expressed care and engagement.</div>
            <div style="margin-bottom: 5px;">• Activities department engaged residents with meaningful programs.</div>
            <div style="margin-bottom: 5px;">• IDT was professional with obvious teamwork demonstrated.</div>
            <div style="margin-bottom: 5px;">• Frontline staff demonstrated knowledge of resident preferences combined with an obvious caring attitude.</div>
        </div>
    </div>

    <!-- Footer Section -->
    <div class="footer">
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-label">CONSULTANT NAME:</div>
                <div class="signature-line"></div>
            </div>
            <div class="signature-box">
                <div class="signature-label">CONSULTANT TITLE:</div>
                <div class="signature-line"></div>
            </div>
            <div class="signature-box">
                <div class="signature-label"> DATE</div>
                <div class="signature-line"></div>
            </div>
        </div>

        <div class="disclaimer">
            Any deficiency statement ending with an asterisk (*) denotes a deficiency which the institution may be excused from correcting providing it is determined that other safeguards provide sufficient protection to the patients. (See instructions.) Except for nursing homes, the findings stated above are disclosable 90 days following the date of survey whether or not a plan of correction is provided. For nursing homes, the above findings and plans of correction are disclosable 14 days following the date these documents are made available to the facility. If deficiencies are cited, an approved plan of correction is requisite to continued program participation.
        </div>

        <div class="page-footer">
            <div>Facility: <span id="eventId">${survey?.facilityId?.name ?? ''}</span> Facility ID: <span id="facilityId">${survey?.facilityId?.providerNumber ?? ''}</span></div>
            
        </div>
    </div>

  
</body>
</html>

  
  
  `;
};
