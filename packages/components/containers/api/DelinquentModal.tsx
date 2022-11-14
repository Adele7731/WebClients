import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { AlertModal, ModalProps, SettingsLink } from '../../components';
import { useConfig } from '../../hooks';

const DelinquentModal = (props: ModalProps) => {
    const { APP_NAME } = useConfig();
    const title = c('Delinquent modal title').t`Overdue invoice`;

    return (
        <AlertModal
            title={title}
            buttons={[
                <ButtonLike color="norm" as={SettingsLink} path={getInvoicesPathname(APP_NAME)} onClick={props.onClose}>
                    {c('Action').t`View invoice`}
                </ButtonLike>,
            ]}
            {...props}
        >
            <div>
                {c('Info')
                    .t`Your ${BRAND_NAME} account is currently on hold. To continue using your account, please pay any overdue invoices.`}
            </div>
        </AlertModal>
    );
};

export default DelinquentModal;
