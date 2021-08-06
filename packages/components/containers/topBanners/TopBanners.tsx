import * as React from 'react';

import BadAppVersionBanner from './BadAppVersionBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import SubUserTopBanner from './SubUserTopBanner';
import DeskopNotificationTopBanner from './DeskopNotificationTopBanner';
import TimeOutOfSyncTopBanner from './TimeOutOfSyncTopBanner';
import EarlyAccessDesynchronizedBanner from './EarlyAccessDesynchronizedBanner';

interface Props {
    children?: React.ReactNode;
}

const TopBanners = ({ children }: Props) => {
    return (
        <>
            <DelinquentTopBanner />
            <OnlineTopBanner />
            <TimeOutOfSyncTopBanner />
            <StorageLimitTopBanner />
            <BadAppVersionBanner />
            <SubUserTopBanner />
            <DeskopNotificationTopBanner />
            <EarlyAccessDesynchronizedBanner />
            {children}
        </>
    );
};

export default TopBanners;
