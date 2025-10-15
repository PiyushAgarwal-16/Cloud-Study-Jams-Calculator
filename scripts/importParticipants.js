/**
 * Script to import participant profile URLs from CSV file
 * and update the enrollment configuration
 */

const fs = require('fs').promises;
const path = require('path');

class ParticipantImporter {
    constructor() {
        this.enrollmentConfigPath = path.join(__dirname, '../config/enrolledParticipants.json');
    }

    /**
     * Parse CSV content and extract profile URLs
     * @param {string} csvContent - Raw CSV file content
     * @returns {Array} Array of profile URLs
     */
    parseCsvContent(csvContent) {
        const lines = csvContent.split('\n').map(line => line.trim());
        const profileUrls = [];

        for (let i = 1; i < lines.length; i++) { // Skip header row
            const line = lines[i];
            if (line && line.startsWith('https://www.cloudskillsboost.google/public_profiles/')) {
                profileUrls.push(line);
            }
        }

        return profileUrls;
    }

    /**
     * Extract profile ID from URL
     * @param {string} profileUrl - Full profile URL
     * @returns {string} Profile ID
     */
    extractProfileId(profileUrl) {
        const match = profileUrl.match(/public_profiles\/([a-f0-9\-]+)/);
        return match ? match[1] : null;
    }

    /**
     * Generate participant objects from URLs
     * @param {Array} profileUrls - Array of profile URLs
     * @returns {Array} Array of participant objects
     */
    generateParticipants(profileUrls) {
        return profileUrls.map((url, index) => {
            const profileId = this.extractProfileId(url);
            return {
                id: `participant-${String(index + 1).padStart(3, '0')}`,
                profileId: profileId,
                profileUrl: url,
                enrollmentDate: "2025-10-15T00:00:00.000Z",
                status: "enrolled",
                name: `Participant ${index + 1}`, // Placeholder name
                batch: "Cloud Study Jams 2025"
            };
        });
    }

    /**
     * Update enrollment configuration file
     * @param {Array} participants - Array of participant objects
     */
    async updateEnrollmentConfig(participants) {
        const enrollmentData = {
            lastUpdated: new Date().toISOString(),
            totalParticipants: participants.length,
            batch: "Cloud Study Jams 2025",
            program: "Google Cloud Skills Boost",
            participants: participants
        };

        // Ensure config directory exists
        const configDir = path.dirname(this.enrollmentConfigPath);
        try {
            await fs.access(configDir);
        } catch (error) {
            await fs.mkdir(configDir, { recursive: true });
        }

        // Write the configuration file
        await fs.writeFile(
            this.enrollmentConfigPath, 
            JSON.stringify(enrollmentData, null, 2), 
            'utf8'
        );

        console.log(`✅ Successfully imported ${participants.length} participants to ${this.enrollmentConfigPath}`);
    }

    /**
     * Import participants from CSV file
     * @param {string} csvFilePath - Path to CSV file
     */
    async importFromCsv(csvFilePath) {
        try {
            console.log(`📂 Reading CSV file: ${csvFilePath}`);
            
            // Read CSV file
            const csvContent = await fs.readFile(csvFilePath, 'utf8');
            
            // Parse URLs
            const profileUrls = this.parseCsvContent(csvContent);
            console.log(`🔍 Found ${profileUrls.length} profile URLs in CSV`);

            // Generate participant objects
            const participants = this.generateParticipants(profileUrls);
            
            // Update configuration
            await this.updateEnrollmentConfig(participants);

            // Display summary
            this.displayImportSummary(participants);

        } catch (error) {
            console.error('❌ Error importing participants:', error.message);
            throw error;
        }
    }

    /**
     * Import from CSV content string (for direct paste)
     * @param {string} csvContent - Raw CSV content
     */
    async importFromCsvContent(csvContent) {
        try {
            console.log('📋 Processing CSV content...');
            
            // Parse URLs
            const profileUrls = this.parseCsvContent(csvContent);
            console.log(`🔍 Found ${profileUrls.length} profile URLs`);

            // Generate participant objects
            const participants = this.generateParticipants(profileUrls);
            
            // Update configuration
            await this.updateEnrollmentConfig(participants);

            // Display summary
            this.displayImportSummary(participants);

            return participants;

        } catch (error) {
            console.error('❌ Error importing participants:', error.message);
            throw error;
        }
    }

    /**
     * Display import summary
     * @param {Array} participants - Array of imported participants
     */
    displayImportSummary(participants) {
        console.log('\n📊 Import Summary:');
        console.log('='.repeat(50));
        console.log(`Total Participants: ${participants.length}`);
        console.log(`Enrollment Date: ${participants[0]?.enrollmentDate}`);
        console.log(`Batch: ${participants[0]?.batch}`);
        
        console.log('\n🎯 Sample Participants:');
        participants.slice(0, 5).forEach(participant => {
            console.log(`  - ${participant.id}: ${participant.profileId}`);
        });
        
        if (participants.length > 5) {
            console.log(`  ... and ${participants.length - 5} more`);
        }

        console.log('\n✅ Configuration updated successfully!');
        console.log('🚀 You can now start the server and verify participants.');
    }

    /**
     * Validate all profile URLs
     * @param {Array} participants - Array of participant objects
     * @returns {Object} Validation results
     */
    validateParticipants(participants) {
        const validation = {
            valid: [],
            invalid: [],
            duplicates: []
        };

        const seenUrls = new Set();
        const urlPattern = /^https:\/\/www\.cloudskillsboost\.google\/public_profiles\/[a-f0-9\-]+$/;

        participants.forEach(participant => {
            // Check URL format
            if (!urlPattern.test(participant.profileUrl)) {
                validation.invalid.push(participant);
                return;
            }

            // Check for duplicates
            if (seenUrls.has(participant.profileUrl)) {
                validation.duplicates.push(participant);
                return;
            }

            seenUrls.add(participant.profileUrl);
            validation.valid.push(participant);
        });

        return validation;
    }
}

module.exports = ParticipantImporter;

// If run directly, import from the provided CSV content
if (require.main === module) {
    const csvContent = `Google Cloud Skills Boost Profile URL
https://www.cloudskillsboost.google/public_profiles/08b1ccd5-2a59-48af-a182-64b52039549a
https://www.cloudskillsboost.google/public_profiles/a0de40fa-6bae-4820-b61b-5f6624223e0f
https://www.cloudskillsboost.google/public_profiles/7209c4af-4971-4292-8c8a-61cdd2b1f0ec
https://www.cloudskillsboost.google/public_profiles/1ef5ba14-df4b-4a02-96f7-8bc5a2c30a10
https://www.cloudskillsboost.google/public_profiles/c1d387a6-8683-4f23-9f41-fa57128a3173
https://www.cloudskillsboost.google/public_profiles/ff8123ed-5e0f-4f27-affd-7feb652920ab
https://www.cloudskillsboost.google/public_profiles/9334e94d-ca48-46c0-81ee-a778b5764f20
https://www.cloudskillsboost.google/public_profiles/b5676e41-39d2-4d63-b28c-ade66b3ed4c7
https://www.cloudskillsboost.google/public_profiles/a1fd4b48-6455-42ad-a2b7-e9295e17a6fa
https://www.cloudskillsboost.google/public_profiles/4a58ac44-c361-45ec-acaf-b529eebe0a37
https://www.cloudskillsboost.google/public_profiles/5b4855c0-0288-41c3-8bd1-f0d6961fd406
https://www.cloudskillsboost.google/public_profiles/6861d806-a17d-49db-9d72-6d574de12080
https://www.cloudskillsboost.google/public_profiles/66558801-0e4d-48af-a607-5494d4b9eb40
https://www.cloudskillsboost.google/public_profiles/7a5c5270-2f36-4265-8dda-06907b24152e
https://www.cloudskillsboost.google/public_profiles/cc7af6d5-cf07-4af8-8ab5-f602513f36b9
https://www.cloudskillsboost.google/public_profiles/76525c15-90af-4199-b4a5-591280585e3e
https://www.cloudskillsboost.google/public_profiles/8a770670-766c-4ef0-8d30-14fd808405aa
https://www.cloudskillsboost.google/public_profiles/bbd4404d-34ff-45a0-9fa9-afead2935e0f
https://www.cloudskillsboost.google/public_profiles/f0f74541-9ca3-4c82-854b-47a1ce35a141
https://www.cloudskillsboost.google/public_profiles/d60973ac-afa4-48df-8f37-d1a1f6d4b97e
https://www.cloudskillsboost.google/public_profiles/767f7e00-3758-49f2-85a9-181601a3771e
https://www.cloudskillsboost.google/public_profiles/e5a52121-84b3-4cb0-abcf-cfcf55ff6d7e
https://www.cloudskillsboost.google/public_profiles/3c20af29-1867-44e9-b079-35fbaf866efb
https://www.cloudskillsboost.google/public_profiles/54c4db6c-3edb-405d-ac8b-38ab99b41d8f
https://www.cloudskillsboost.google/public_profiles/d455e87c-df36-4a4d-888c-901aea4852d8
https://www.cloudskillsboost.google/public_profiles/6db487d3-4b1e-441e-bfa0-98bfa379c6d6
https://www.cloudskillsboost.google/public_profiles/510be64c-f30b-4ab3-a99d-145bdde9b85d
https://www.cloudskillsboost.google/public_profiles/4d8b7bd6-2847-45aa-be4e-02eea01f4672
https://www.cloudskillsboost.google/public_profiles/5e192f3b-f3b4-4cc1-9f9a-69add98bd997
https://www.cloudskillsboost.google/public_profiles/1fd95c1b-15cb-4bc7-bfb9-1c03df0b8866
https://www.cloudskillsboost.google/public_profiles/833fa4d0-238b-46c6-8682-f01f9ea0da36
https://www.cloudskillsboost.google/public_profiles/f12a56e4-9a7e-4dcb-b5c9-9d96b28bef5d
https://www.cloudskillsboost.google/public_profiles/d6a14020-1f97-4d3b-a039-81a5e7c4170a
https://www.cloudskillsboost.google/public_profiles/bcae3f7a-973d-4265-81b7-5895050bd5dc
https://www.cloudskillsboost.google/public_profiles/7154f0d2-b2f6-4e9e-b434-d857db608bfa
https://www.cloudskillsboost.google/public_profiles/e9e31d04-8c22-49cd-91b4-0c978782b1c5
https://www.cloudskillsboost.google/public_profiles/be0e6c4b-67dd-489f-bae8-ab8e2638babb
https://www.cloudskillsboost.google/public_profiles/729fdfe5-e649-44b3-a471-b09d632c8cc8
https://www.cloudskillsboost.google/public_profiles/2c1022c1-db80-4acc-b2a0-852bd846096d
https://www.cloudskillsboost.google/public_profiles/49d43913-846f-4493-9188-37dd895a45bc
https://www.cloudskillsboost.google/public_profiles/57600ec9-7dcc-4f88-8e32-b7712adfded0
https://www.cloudskillsboost.google/public_profiles/9628de79-1f36-4fec-a9a8-b220559d54ef
https://www.cloudskillsboost.google/public_profiles/fbf7b8ad-07ff-4bcc-8089-a3dcca13576f
https://www.cloudskillsboost.google/public_profiles/1ba3e049-1633-4431-bd58-1803ffe97361
https://www.cloudskillsboost.google/public_profiles/aa978e3a-aab4-42b6-a931-0fe5a3fc687e
https://www.cloudskillsboost.google/public_profiles/39be8e99-72b0-4869-8b5a-46a0cc0487b2
https://www.cloudskillsboost.google/public_profiles/4f3960ac-e4d8-47ce-9728-8e10ae36f891
https://www.cloudskillsboost.google/public_profiles/f0ad3328-bece-4cc1-859c-258fd73e4a32
https://www.cloudskillsboost.google/public_profiles/4093b993-b044-4566-a0bf-4a4894443164
https://www.cloudskillsboost.google/public_profiles/26d1649a-188d-4d94-bce3-15139ba8b6b0
https://www.cloudskillsboost.google/public_profiles/37482e00-50fc-4e4f-a03d-c8c199f83350
https://www.cloudskillsboost.google/public_profiles/7afd4d17-4af6-46f3-9dd8-6cbd8c63d7f7
https://www.cloudskillsboost.google/public_profiles/b3d26320-40ad-45ef-9355-68ad133bda0a
https://www.cloudskillsboost.google/public_profiles/e24844b7-be1b-4928-9fba-bb88445906ea
https://www.cloudskillsboost.google/public_profiles/a40f4737-b807-44de-a2af-eb5e309373ff
https://www.cloudskillsboost.google/public_profiles/fa2fba5b-daa5-4030-9c73-42306ceafb09
https://www.cloudskillsboost.google/public_profiles/a9054416-44f9-4d61-9f92-7c5f0362031c
https://www.cloudskillsboost.google/public_profiles/a20bf23a-d4be-4974-ade8-1e64fe982a4c
https://www.cloudskillsboost.google/public_profiles/9da23f06-9db6-4864-9969-52bb0ed8f3ef
https://www.cloudskillsboost.google/public_profiles/ba96de7e-b2bf-485f-8730-9f0f9207694a
https://www.cloudskillsboost.google/public_profiles/14074e77-55fd-4fe7-a700-ceeb59419626
https://www.cloudskillsboost.google/public_profiles/74c708e6-305d-4117-bdd8-30f6cf45e4f7
https://www.cloudskillsboost.google/public_profiles/2246615c-6633-48e2-9d67-67fbef9b70a1
https://www.cloudskillsboost.google/public_profiles/0dce5c94-2273-44b4-a44b-3b2d7a2c1d99
https://www.cloudskillsboost.google/public_profiles/ead2bec0-bbff-4587-b8a6-95c9313c2101
https://www.cloudskillsboost.google/public_profiles/17569e58-801a-4a8f-9fb5-9f4835c793c5
https://www.cloudskillsboost.google/public_profiles/0de82d73-d469-4c6c-802f-97fa95732181
https://www.cloudskillsboost.google/public_profiles/15745835-6968-47b2-9ce1-6a853587c287
https://www.cloudskillsboost.google/public_profiles/94821994-05b1-4ecb-ac95-3644c1734f8b
https://www.cloudskillsboost.google/public_profiles/a9c3e21a-d2a8-47f3-bd77-c8b80f057d46
https://www.cloudskillsboost.google/public_profiles/12916c00-21a1-4b57-9164-d1e32e0b88c5
https://www.cloudskillsboost.google/public_profiles/1635dff3-9264-42ac-a386-0b99a38bb70d
https://www.cloudskillsboost.google/public_profiles/cdaddbe8-35b7-4e30-870f-d1c6ddfc4cd6
https://www.cloudskillsboost.google/public_profiles/e232b758-b3cb-4357-aa74-dce2d059a5ec
https://www.cloudskillsboost.google/public_profiles/873db04a-d873-4e99-8c9b-1a3106aa7ac2
https://www.cloudskillsboost.google/public_profiles/eb3320d1-e64c-4b18-bea8-7313241d4e72
https://www.cloudskillsboost.google/public_profiles/b248bb43-2880-426b-9eb9-4daa80a1e293
https://www.cloudskillsboost.google/public_profiles/39a602a9-291e-44a4-9ac5-b0a83107bd2a
https://www.cloudskillsboost.google/public_profiles/a038c91f-c3ac-4a25-bd71-53f55114e967
https://www.cloudskillsboost.google/public_profiles/524c7876-ce43-4b83-a4e6-a44d2fff876d
https://www.cloudskillsboost.google/public_profiles/094570fc-5267-4f2b-864b-1a7e30af7dd8
https://www.cloudskillsboost.google/public_profiles/c3a78c17-f502-4fec-9e1e-d2dfc66eeb73
https://www.cloudskillsboost.google/public_profiles/e2100efb-6e96-419d-8357-fbcc90aeddce
https://www.cloudskillsboost.google/public_profiles/a19fabc1-fb75-496d-a55f-6d5d7ce123fd
https://www.cloudskillsboost.google/public_profiles/5c265b2e-f7aa-4f7a-ad9c-1bfeeb6f5f10
https://www.cloudskillsboost.google/public_profiles/756739ef-bc73-4f2b-955e-0404c0cf105d
https://www.cloudskillsboost.google/public_profiles/1e77d422-4ee7-46b3-8d4e-12f8cf35942e
https://www.cloudskillsboost.google/public_profiles/524b488d-1112-49e8-81ba-84b89beee8f4
https://www.cloudskillsboost.google/public_profiles/eda1850d-9d4f-4486-b92c-d95673638d3f
https://www.cloudskillsboost.google/public_profiles/31c88e0d-80ce-4ce7-a7b6-7172d08942e1
https://www.cloudskillsboost.google/public_profiles/49da9621-e0e9-497a-9cdc-ba6ffb537774
https://www.cloudskillsboost.google/public_profiles/adcff62c-ce1b-42ca-b17e-8e1a471bfaab
https://www.cloudskillsboost.google/public_profiles/596c6d93-02b4-4ef0-bead-35750a3816ab
https://www.cloudskillsboost.google/public_profiles/0fe46a84-9588-4ced-bc6b-0dbf29808497
https://www.cloudskillsboost.google/public_profiles/8fd5114e-3461-469c-8083-8e96822fa75d
https://www.cloudskillsboost.google/public_profiles/3143c942-d766-4c8a-866c-31e774851a60
https://www.cloudskillsboost.google/public_profiles/4bcdbf23-c1e6-472c-b410-ad3ea76a2155
https://www.cloudskillsboost.google/public_profiles/758f783c-8635-4406-9e29-4f353e123ce6
https://www.cloudskillsboost.google/public_profiles/5160fbf3-4f1f-43bb-9817-226a1c456a74
https://www.cloudskillsboost.google/public_profiles/d199f6c4-5b42-4fa8-8c72-524f1030dc16
https://www.cloudskillsboost.google/public_profiles/c1300618-fdf0-4ba4-8bee-9b8dea3ef95f
https://www.cloudskillsboost.google/public_profiles/7e6b9fee-cb47-4966-9681-754cad127619
https://www.cloudskillsboost.google/public_profiles/cfd81bac-ca00-4d03-a171-1805e4dc0ebc
https://www.cloudskillsboost.google/public_profiles/d5c6cbb6-38e8-4cf1-aebc-bcb4bc7eeaa2
https://www.cloudskillsboost.google/public_profiles/a5595ee1-ef1e-4320-af67-f5fbbdb1faa5
https://www.cloudskillsboost.google/public_profiles/e20951f2-81c0-4ed3-9a49-62b085cf828d
https://www.cloudskillsboost.google/public_profiles/b3afbcb7-1320-4aa0-b0e5-05bfd2e52ec7
https://www.cloudskillsboost.google/public_profiles/7500c512-f9e2-462b-9326-77672b685723
https://www.cloudskillsboost.google/public_profiles/9dd7361f-2b1f-47b2-b669-4eb5c3a1509e
https://www.cloudskillsboost.google/public_profiles/93c02b8d-7a13-47e4-9ca8-50ec1c868a7c
https://www.cloudskillsboost.google/public_profiles/1942133d-9b23-40f3-9cea-1d840c20ad99
https://www.cloudskillsboost.google/public_profiles/1b9a3a98-b14f-4bff-83a1-94c9e6869f62
https://www.cloudskillsboost.google/public_profiles/94501a51-fec8-44eb-a213-f9ee1244cda6
https://www.cloudskillsboost.google/public_profiles/9d4fe38d-4ade-48d3-9a2b-3b5b73d54069
https://www.cloudskillsboost.google/public_profiles/b48d2fb3-f6ed-4571-81e9-78c3330e07a2
https://www.cloudskillsboost.google/public_profiles/517fb304-f13c-4023-8ff8-240bbc91a590
https://www.cloudskillsboost.google/public_profiles/fff25f1a-b57e-4a30-9293-79bf4d969390
https://www.cloudskillsboost.google/public_profiles/3f4d4fa1-00fa-4120-8382-5e4020ca9d5e
https://www.cloudskillsboost.google/public_profiles/a094b65d-0127-4e14-87a8-1babea8ed600
https://www.cloudskillsboost.google/public_profiles/0b10b131-ba4b-45bb-8e3e-b3c3ac1ff8fb
https://www.cloudskillsboost.google/public_profiles/683b1833-93c3-48e0-b954-d263d8da0479
https://www.cloudskillsboost.google/public_profiles/29146452-edbd-48fc-9c63-9e5d769f7cb3
https://www.cloudskillsboost.google/public_profiles/517eb45e-963d-44ab-b4ee-831fd06ea357
https://www.cloudskillsboost.google/public_profiles/14c62784-c630-4c74-aecb-3b08f6e84a0e
https://www.cloudskillsboost.google/public_profiles/942c3f97-2e31-4610-ab13-75583c5301a2
https://www.cloudskillsboost.google/public_profiles/f3c29b0d-7cad-44e4-ad24-a6560456a251
https://www.cloudskillsboost.google/public_profiles/254d3459-daf3-41d2-868c-6b7db55b5842
https://www.cloudskillsboost.google/public_profiles/4978a42a-4866-4926-9425-280cf93b7907
https://www.cloudskillsboost.google/public_profiles/7aa92556-702f-442f-9c8e-da97787d0354
https://www.cloudskillsboost.google/public_profiles/4657b2c5-7f3f-4920-9def-29f88af70233
https://www.cloudskillsboost.google/public_profiles/f07b0aca-0cb2-4147-851a-3c77050982ec
https://www.cloudskillsboost.google/public_profiles/c2b1baaa-b505-4434-84d5-c22df38be70c
https://www.cloudskillsboost.google/public_profiles/2c8a2629-cb4f-4f86-b6ce-14adaa0c9afb
https://www.cloudskillsboost.google/public_profiles/f5ed3519-86cf-46d8-ad81-b25202b542b1
https://www.cloudskillsboost.google/public_profiles/85ce5a67-0e75-440e-b210-c2a28bb6fe59
https://www.cloudskillsboost.google/public_profiles/bf6d8739-e3fe-42a6-8fd3-eb03b890ba61
https://www.cloudskillsboost.google/public_profiles/21ca7db1-2ad3-4957-a862-d6749dd41501
https://www.cloudskillsboost.google/public_profiles/a0a8b3f2-1a6d-4cfa-884c-fe42a962138a
https://www.cloudskillsboost.google/public_profiles/6543dcc3-f68a-4a5a-a3e7-a8d891538595
https://www.cloudskillsboost.google/public_profiles/778e93c3-421f-4069-852f-33dd91db5445
https://www.cloudskillsboost.google/public_profiles/79d207f6-dd31-45a3-a825-7927c6218288
https://www.cloudskillsboost.google/public_profiles/72569d0f-ab6c-4703-99e4-8da98bf40a93
https://www.cloudskillsboost.google/public_profiles/10697468-5c86-4abd-b7d6-3082a88b1184
https://www.cloudskillsboost.google/public_profiles/b73d65b1-b3d2-4f0f-b2e2-f6cd083ccecb
https://www.cloudskillsboost.google/public_profiles/b43f3cd8-621b-4286-a177-8b41c982ed1a
https://www.cloudskillsboost.google/public_profiles/4b849b4f-7b8b-4737-b731-c87cefb608e5
https://www.cloudskillsboost.google/public_profiles/bf041d63-050e-4da1-9aa5-71862eed7099
https://www.cloudskillsboost.google/public_profiles/d25a08a8-6032-4e06-8102-b3559c730149
https://www.cloudskillsboost.google/public_profiles/cec3824f-a6bd-4e72-b6f5-338b6a95e5f1
https://www.cloudskillsboost.google/public_profiles/f42e09f9-edff-44b2-bf26-845ca3b0e0db
https://www.cloudskillsboost.google/public_profiles/774ead9d-1612-42fb-8224-654bcf2646c8
https://www.cloudskillsboost.google/public_profiles/20262fac-4084-40aa-a75b-e861afd8f53b
https://www.cloudskillsboost.google/public_profiles/a095831d-d89c-4fcb-b5b7-adf5f1458183
https://www.cloudskillsboost.google/public_profiles/ea56a5c4-f333-47a7-9042-28bbc122b484
https://www.cloudskillsboost.google/public_profiles/95885dd0-569a-40b5-868f-5bba77e5b90e
https://www.cloudskillsboost.google/public_profiles/0edfa736-204c-41c4-94f2-44db170bedc9
https://www.cloudskillsboost.google/public_profiles/f16b90ef-0cd2-4b69-8a5c-a67c562e55ab
https://www.cloudskillsboost.google/public_profiles/3d8de72d-c89d-486f-84f9-b8a0e98a5850
https://www.cloudskillsboost.google/public_profiles/4afce0fe-3c5d-4a48-b15a-a4bdf4998daa
https://www.cloudskillsboost.google/public_profiles/708af2d5-87eb-44b8-b875-2c31fa7cd0d0
https://www.cloudskillsboost.google/public_profiles/a54975db-0b0b-4117-a212-996008133779
https://www.cloudskillsboost.google/public_profiles/b2c13541-f446-448e-b4a5-96b1fed3d3e0
https://www.cloudskillsboost.google/public_profiles/8dc42688-b212-4460-8dd2-f0d55b4fc3d0
https://www.cloudskillsboost.google/public_profiles/2f3dce2e-96b4-4cf1-b504-5cc16a5d2e11
https://www.cloudskillsboost.google/public_profiles/4769c156-0447-4375-bcef-dc35e6e29163
https://www.cloudskillsboost.google/public_profiles/b5366c61-e825-4f22-bef3-494508920dce
https://www.cloudskillsboost.google/public_profiles/9f514b9b-8a28-4ee3-8608-29579be29f1d
https://www.cloudskillsboost.google/public_profiles/d42a1de6-82c6-40b1-b04d-274a6ba63f24
https://www.cloudskillsboost.google/public_profiles/63b7832e-4aba-489a-9b84-15b6bc014808
https://www.cloudskillsboost.google/public_profiles/0f252181-bb07-47e1-aeaa-115805a7e1e7
https://www.cloudskillsboost.google/public_profiles/f9abc7b1-8fdc-4c0f-ba34-87d6e63858fa
https://www.cloudskillsboost.google/public_profiles/19cc236f-2c6a-45cc-ac3b-24165a4304cf
https://www.cloudskillsboost.google/public_profiles/0cf4b300-4b15-4d67-8a0e-9ed82fbd8c7a
https://www.cloudskillsboost.google/public_profiles/ace77f8b-24e5-46ba-84d2-e59c1cda9c40
https://www.cloudskillsboost.google/public_profiles/d090aee1-efbd-418d-a7c4-0f9d5aa05611
https://www.cloudskillsboost.google/public_profiles/39deba1a-8699-4c67-a6a3-19408e4aa7b8
https://www.cloudskillsboost.google/public_profiles/183f739f-8f99-412b-a5ae-1cf4b69018ac
https://www.cloudskillsboost.google/public_profiles/da554e1b-29c6-4258-a97f-9fc471f20d38
https://www.cloudskillsboost.google/public_profiles/485fd732-c7fb-4efe-a4c3-e35f730039c3
https://www.cloudskillsboost.google/public_profiles/cfb9248c-324d-48e0-874f-0bfac3b99e74
https://www.cloudskillsboost.google/public_profiles/0db11651-35d3-4b12-9d37-4f2e409eca53
https://www.cloudskillsboost.google/public_profiles/85880afe-21fe-401a-9409-43657f424bd6
https://www.cloudskillsboost.google/public_profiles/f8fec3c0-89a3-42d2-af63-a88323c5af28
https://www.cloudskillsboost.google/public_profiles/d674b711-c6d5-4ba5-bf85-1a9320122423
https://www.cloudskillsboost.google/public_profiles/6db94f58-f1fe-4902-917d-ccf92c81eb02
https://www.cloudskillsboost.google/public_profiles/7fd8e416-d3e5-440b-9acd-6ab482353142
https://www.cloudskillsboost.google/public_profiles/d6bd90c4-9538-4493-85d5-ce134ab4f1ff
https://www.cloudskillsboost.google/public_profiles/6ac64f41-2101-4026-a455-16e044f4a9c7
https://www.cloudskillsboost.google/public_profiles/428c2a81-0548-4d18-8f35-c32883ec4d47
https://www.cloudskillsboost.google/public_profiles/8595d22c-ed92-48f7-ae34-0f134c6bf18c
https://www.cloudskillsboost.google/public_profiles/628c80f1-0608-4fd3-8475-456279f1b84c
https://www.cloudskillsboost.google/public_profiles/b5474c3b-8633-40fe-b3fc-6af4b2579379
https://www.cloudskillsboost.google/public_profiles/93fbb70c-7748-4067-80d7-a27042e61ac1
https://www.cloudskillsboost.google/public_profiles/4314927d-ed4a-4e7c-b421-c04f6e6b5292
https://www.cloudskillsboost.google/public_profiles/4ad281b5-3f31-4625-97df-82510b60dc69
https://www.cloudskillsboost.google/public_profiles/e1ffaf20-67e8-457a-840a-1d7589d59b6c`;

    async function runImport() {
        const importer = new ParticipantImporter();
        try {
            await importer.importFromCsvContent(csvContent);
        } catch (error) {
            console.error('Import failed:', error);
            process.exit(1);
        }
    }

    runImport();
}