import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Alert,
    ConfirmModal,
    MozillaInfoPanel,
    useSubscription,
    useApiWithoutResult,
    Button,
    Loader,
    Paragraph,
    usePlans,
    useUser,
    useToggle,
    useModals,
    useEventManager,
    useNotifications
} from 'react-components';

import { checkSubscription, deleteSubscription } from 'proton-shared/lib/api/payments';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';

import SubscriptionModal from './subscription/SubscriptionModal';
import { mergePlansMap, getCheckParams, isBundleEligible } from './subscription/helpers';
import UpgradeModal from './subscription/UpgradeModal';
import PlansTable from './PlansTable';

const PlansSection = () => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [user] = useUser();
    const { isFree, isPaid } = user;
    const [subscription = {}, loadingSubscription] = useSubscription();
    const [plans = [], loadingPlans] = usePlans();
    const { state, toggle } = useToggle(!isPaid);

    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [cycle, setCycle] = useState(DEFAULT_CYCLE);
    const { request: requestCheckSubscription } = useApiWithoutResult(checkSubscription);
    const { request: requestDeleteSubscription } = useApiWithoutResult(deleteSubscription);
    const bundleEligible = isBundleEligible(subscription);
    const { CouponCode } = subscription;

    const handleUnsubscribe = async () => {
        await requestDeleteSubscription();
        await call();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleOpenModal = () => {
        if (isFree) {
            return createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
        }
        createModal(
            <ConfirmModal
                title={c('Title').t`Confirm downgrade`}
                onConfirm={handleUnsubscribe}
                confirm={c('Action').t`Downgrade`}
            >
                <Paragraph>{c('Info')
                    .t`This will downgrade your account to a free account. This Proton product is free software that is supported by donations and paid accounts. Please consider making a donation so we can continue to offer the service for free.`}</Paragraph>
                <Alert>{c('Info')
                    .t`Additional addresses, custom domains, and users must be removed/disabled before performing this action.`}</Alert>
            </ConfirmModal>
        );
    };

    const handleModal = (newPlansMap) => async () => {
        if (!newPlansMap) {
            handleOpenModal();
            return;
        }

        const plansMap = mergePlansMap(newPlansMap, subscription);
        const couponCode = CouponCode ? CouponCode : undefined; // From current subscription; CouponCode can be null
        const { Coupon } = await requestCheckSubscription(
            getCheckParams({ plans, plansMap, currency, cycle, coupon: couponCode })
        );
        const coupon = Coupon ? Coupon.Code : undefined; // Coupon can equals null

        createModal(<SubscriptionModal plansMap={plansMap} coupon={coupon} currency={currency} cycle={cycle} />);
    };

    useEffect(() => {
        const [{ Currency, Cycle } = {}] = plans;
        setCurrency(subscription.Currency || Currency);
        setCycle(subscription.Cycle || Cycle);
    }, [loadingSubscription, loadingPlans]);

    useEffect(() => {
        if (isFree) {
            createModal(
                <UpgradeModal onComparePlans={() => !state && toggle()} onUpgrade={handleModal({ plus: 1 })} />
            );
        }
    }, []);

    if (subscription.isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Plans`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    if (loadingSubscription || loadingPlans) {
        return (
            <>
                <SubTitle>{c('Title').t`Plans`}</SubTitle>
                <Loader />
            </>
        );
    }

    return (
        <>
            <SubTitle>{c('Title').t`Plans`}</SubTitle>
            {bundleEligible ? (
                <Alert learnMore="https://protonmail.com/support/knowledge-base/paid-plans/">{c('Info')
                    .t`Get 20% bundle discount when you purchase ProtonMail and ProtonVPN together.`}</Alert>
            ) : null}
            <Button onClick={toggle}>{state ? c('Action').t`Hide plans` : c('Action').t`Show plans`}</Button>
            {state ? (
                <>
                    <PlansTable
                        currency={currency}
                        cycle={cycle}
                        updateCurrency={setCurrency}
                        updateCycle={setCycle}
                        onSelect={handleModal}
                        user={user}
                        subscription={subscription}
                        plans={plans}
                    />
                    <p className="small">* {c('Info concerning plan features').t`denotes customizable features`}</p>
                </>
            ) : null}
        </>
    );
};

export default PlansSection;
