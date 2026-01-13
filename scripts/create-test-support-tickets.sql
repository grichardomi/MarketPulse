-- Script to create test support tickets for demo purposes
-- Run this against your PostgreSQL database

-- First, let's check if we have users with different subscription tiers
-- If not, you'll need to create them or update existing users

-- Example: Get user IDs (you'll need to replace these with actual IDs from your database)
-- SELECT id, email, role FROM "User" ORDER BY id LIMIT 5;

-- =============================================================================
-- TEST TICKET 1: Open ticket from Starter user (Standard Support)
-- =============================================================================

DO $$
DECLARE
    test_user_id INTEGER;
    ticket_id INTEGER;
BEGIN
    -- Get a user ID (replace with actual user ID)
    SELECT id INTO test_user_id FROM "User" WHERE role = 'user' LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Create ticket
        INSERT INTO "SupportTicket" (
            "userId",
            subject,
            description,
            status,
            priority,
            category,
            "createdAt",
            "updatedAt"
        ) VALUES (
            test_user_id,
            'Unable to add competitor website',
            E'Hi, I\'m trying to add a competitor URL but I keep getting an error message saying "Failed to fetch competitor data". The website is definitely accessible in my browser. Could you help me troubleshoot this?\n\nThe URL I\'m trying to add is: https://example-competitor.com\n\nThank you!',
            'open',
            'standard',
            'technical',
            NOW() - INTERVAL '2 hours',
            NOW() - INTERVAL '2 hours'
        ) RETURNING id INTO ticket_id;

        RAISE NOTICE 'Created ticket #% for user %', ticket_id, test_user_id;
    END IF;
END $$;

-- =============================================================================
-- TEST TICKET 2: In Progress ticket from Professional user (Priority Support)
-- =============================================================================

DO $$
DECLARE
    test_user_id INTEGER;
    ticket_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM "User" WHERE role = 'user' LIMIT 1 OFFSET 1;

    IF test_user_id IS NOT NULL THEN
        -- Create ticket
        INSERT INTO "SupportTicket" (
            "userId",
            subject,
            description,
            status,
            priority,
            category,
            "createdAt",
            "updatedAt"
        ) VALUES (
            test_user_id,
            'Billing question: Upgrade to Enterprise plan',
            E'Hello,\n\nI\'m currently on the Professional plan and considering upgrading to Enterprise. I have a few questions:\n\n1. Will my historical data be preserved?\n2. Can I switch mid-billing cycle?\n3. Will I get prorated charges?\n\nPlease advise. Thanks!',
            'in_progress',
            'priority',
            'billing',
            NOW() - INTERVAL '1 day',
            NOW() - INTERVAL '3 hours'
        ) RETURNING id INTO ticket_id;

        -- Add admin response
        INSERT INTO "SupportTicketMessage" (
            "ticketId",
            "userId",
            message,
            "isAdminResponse",
            "createdAt"
        ) VALUES (
            ticket_id,
            NULL,
            E'Hi there!\n\nGreat questions! Let me answer each one:\n\n1. Yes, all your historical data will be preserved when upgrading. You\'ll actually get access to UNLIMITED history instead of the 90-day limit.\n\n2. Yes, you can upgrade at any time. The change takes effect immediately.\n\n3. Yes, we prorate charges. You\'ll only pay for the remaining days in your billing cycle at the new rate.\n\nWould you like me to help you with the upgrade process?',
            true,
            NOW() - INTERVAL '3 hours'
        );

        RAISE NOTICE 'Created in-progress ticket #% for user %', ticket_id, test_user_id;
    END IF;
END $$;

-- =============================================================================
-- TEST TICKET 3: Urgent Open ticket from Enterprise user (Dedicated Support)
-- =============================================================================

DO $$
DECLARE
    test_user_id INTEGER;
    ticket_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM "User" WHERE role = 'user' LIMIT 1 OFFSET 2;

    IF test_user_id IS NOT NULL THEN
        INSERT INTO "SupportTicket" (
            "userId",
            subject,
            description,
            status,
            priority,
            category,
            "createdAt",
            "updatedAt"
        ) VALUES (
            test_user_id,
            'URGENT: Price alerts not being sent',
            E'URGENT: Our team is not receiving price change alerts for the past 6 hours. This is critical for our business operations as we need real-time notifications.\n\nAffected competitors:\n- All 15 tracked competitors\n- No email alerts received since 8:00 AM\n- Dashboard shows price changes but no notifications\n\nPlease investigate ASAP as this is impacting our pricing strategy decisions.\n\nPriority: CRITICAL',
            'open',
            'dedicated',
            'technical',
            NOW() - INTERVAL '45 minutes',
            NOW() - INTERVAL '45 minutes'
        ) RETURNING id INTO ticket_id;

        RAISE NOTICE 'Created urgent ticket #% for user %', ticket_id, test_user_id;
    END IF;
END $$;

-- =============================================================================
-- TEST TICKET 4: Resolved ticket with conversation
-- =============================================================================

DO $$
DECLARE
    test_user_id INTEGER;
    ticket_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM "User" WHERE role = 'user' LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        INSERT INTO "SupportTicket" (
            "userId",
            subject,
            description,
            status,
            priority,
            category,
            "createdAt",
            "updatedAt",
            "resolvedAt"
        ) VALUES (
            test_user_id,
            'How to export competitor data?',
            E'Hi,\n\nI need to export my competitor tracking data for a presentation. Is there a way to download this information as a CSV or Excel file?\n\nThanks!',
            'resolved',
            'standard',
            'other',
            NOW() - INTERVAL '3 days',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days'
        ) RETURNING id INTO ticket_id;

        -- Admin response
        INSERT INTO "SupportTicketMessage" (
            "ticketId",
            "userId",
            message,
            "isAdminResponse",
            "createdAt"
        ) VALUES (
            ticket_id,
            NULL,
            E'Hello!\n\nCurrently, the export feature is not available in the dashboard, but you can:\n\n1. Use the browser\'s print function to save as PDF\n2. Take screenshots of the charts and data\n3. Copy the data tables and paste into Excel\n\nWe\'re working on a proper export feature for a future release. Would any of these workarounds help you?',
            true,
            NOW() - INTERVAL '2 days 20 hours'
        );

        -- User response
        INSERT INTO "SupportTicketMessage" (
            "ticketId",
            "userId",
            message,
            "isAdminResponse",
            "createdAt"
        ) VALUES (
            ticket_id,
            test_user_id,
            E'Perfect! The screenshot option will work fine for my presentation. Looking forward to the export feature in the future.\n\nThanks for the quick help!',
            false,
            NOW() - INTERVAL '2 days 18 hours'
        );

        RAISE NOTICE 'Created resolved ticket #% for user %', ticket_id, test_user_id;
    END IF;
END $$;

-- =============================================================================
-- TEST TICKET 5: Feature Request ticket (Priority)
-- =============================================================================

DO $$
DECLARE
    test_user_id INTEGER;
    ticket_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM "User" WHERE role = 'user' LIMIT 1 OFFSET 1;

    IF test_user_id IS NOT NULL THEN
        INSERT INTO "SupportTicket" (
            "userId",
            subject,
            description,
            status,
            priority,
            category,
            "createdAt",
            "updatedAt"
        ) VALUES (
            test_user_id,
            'Feature Request: Slack integration for alerts',
            E'Hi team,\n\nWe love MarketPulse but would really benefit from Slack integration. Currently we get email alerts, but it would be much better if price changes could be posted directly to our #competitive-intel Slack channel.\n\nFeatures we\'d like:\n- Direct Slack notifications for price changes\n- Customizable message format\n- Ability to tag team members\n- Separate channels for different alert types\n\nIs this on your roadmap? We\'d be happy to beta test!\n\nThanks,\nJohn',
            'open',
            'priority',
            'feature_request',
            NOW() - INTERVAL '5 hours',
            NOW() - INTERVAL '5 hours'
        ) RETURNING id INTO ticket_id;

        RAISE NOTICE 'Created feature request ticket #% for user %', ticket_id, test_user_id;
    END IF;
END $$;

-- =============================================================================
-- TEST TICKET 6: Closed ticket
-- =============================================================================

DO $$
DECLARE
    test_user_id INTEGER;
    ticket_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM "User" WHERE role = 'user' LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        INSERT INTO "SupportTicket" (
            "userId",
            subject,
            description,
            status,
            priority,
            category,
            "createdAt",
            "updatedAt",
            "resolvedAt"
        ) VALUES (
            test_user_id,
            'Password reset not working',
            E'I tried to reset my password but never received the email. Can you help?',
            'closed',
            'standard',
            'technical',
            NOW() - INTERVAL '1 week',
            NOW() - INTERVAL '6 days',
            NOW() - INTERVAL '6 days'
        ) RETURNING id INTO ticket_id;

        -- Admin response
        INSERT INTO "SupportTicketMessage" (
            "ticketId",
            "userId",
            message,
            "isAdminResponse",
            "createdAt"
        ) VALUES (
            ticket_id,
            NULL,
            E'Hi there,\n\nI\'ve checked your account and resent the password reset email. Please check your spam folder as well.\n\nThe email should arrive within 5 minutes. Let me know if you still don\'t see it!',
            true,
            NOW() - INTERVAL '6 days 23 hours'
        );

        -- User response
        INSERT INTO "SupportTicketMessage" (
            "ticketId",
            "userId",
            message,
            "isAdminResponse",
            "createdAt"
        ) VALUES (
            ticket_id,
            test_user_id,
            E'Got it! It was in my spam folder. All set now, thank you!',
            false,
            NOW() - INTERVAL '6 days 22 hours'
        );

        RAISE NOTICE 'Created closed ticket #% for user %', ticket_id, test_user_id;
    END IF;
END $$;

-- =============================================================================
-- TEST TICKET 7: Another Dedicated support ticket (In Progress)
-- =============================================================================

DO $$
DECLARE
    test_user_id INTEGER;
    ticket_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM "User" WHERE role = 'user' LIMIT 1 OFFSET 2;

    IF test_user_id IS NOT NULL THEN
        INSERT INTO "SupportTicket" (
            "userId",
            subject,
            description,
            status,
            priority,
            category,
            "createdAt",
            "updatedAt"
        ) VALUES (
            test_user_id,
            'API access setup assistance',
            E'Hello,\n\nWe just upgraded to Enterprise and would like to set up API access for our internal dashboard. Could you provide:\n\n1. API documentation\n2. Authentication credentials\n3. Rate limits and best practices\n4. Sample code for common operations\n\nOur tech stack: React + Node.js\n\nThanks!',
            'in_progress',
            'dedicated',
            'technical',
            NOW() - INTERVAL '8 hours',
            NOW() - INTERVAL '4 hours'
        ) RETURNING id INTO ticket_id;

        -- Admin response
        INSERT INTO "SupportTicketMessage" (
            "ticketId",
            "userId",
            message,
            "isAdminResponse",
            "createdAt"
        ) VALUES (
            ticket_id,
            NULL,
            E'Hi there!\n\nCongratulations on upgrading to Enterprise! I\'ll help you get set up with API access.\n\nI\'ve generated your API credentials and will send them via secure email separately. Here\'s what you need to know:\n\n1. **Documentation**: https://docs.marketpulse.com/api\n2. **Rate Limits**: 1000 requests/hour for Enterprise\n3. **Best Practices**: Use webhooks for real-time updates instead of polling\n\nI\'ll also prepare some React/Node.js sample code and send that over within the next hour.\n\nAnything else you need to get started?',
            true,
            NOW() - INTERVAL '4 hours'
        );

        RAISE NOTICE 'Created dedicated support ticket #% for user %', ticket_id, test_user_id;
    END IF;
END $$;

-- =============================================================================
-- Verify tickets were created
-- =============================================================================

SELECT
    id,
    subject,
    status,
    priority,
    category,
    "createdAt"
FROM "SupportTicket"
ORDER BY "createdAt" DESC
LIMIT 10;
